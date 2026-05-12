import { useShopTokenContext } from "../../context/ShopTokenContext.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import { PartyStoreStatblock, usePartyStore } from "../../context/PartyStore.tsx";
import { ShopItems } from "./ShopItems.tsx";
import shopStyles from "./shop.module.scss";
import { useBuyPartyItem } from "../../api/tabletop-almanac/useParty.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { ShopItemType } from "../../helper/types.ts";
import { updateShopMetadata } from "../../helper/tokenHelper.ts";
import { ShoppingCart, CheckCircle, ShoppingBag, DeleteOutline } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { MoneyDisplay } from "../money/MoneyDisplay.tsx";
import { ShopHeader } from "./ShopHeader.tsx";
import Tippy from "@tippyjs/react";
import { useE5GetStatblock } from "../../api/e5/useE5Api.ts";
import { setNullToZero } from "../../helper/moneyHelpers.ts";

export const ShopPlayer = () => {
    const apiKey = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);
    const data = useShopTokenContext((state) => state.data);
    const token = useShopTokenContext((state) => state.token);
    const playerContext = usePlayerContext();
    const currentParty = usePartyStore((state) => state.currentParty);
    const partyId = useMetadataContext((state) => state.room?.partyId);
    const [view, setView] = useState<"items" | "cart">("items");
    const [member, setMember] = useState<PartyStoreStatblock | null>(null);

    const members = currentParty?.members.filter((m) => m.playerId === playerContext.id);

    const statblockQuery = useE5GetStatblock(member ? (member.statblock?.slug ?? "") : "", apiKey);

    const statblock = statblockQuery.isSuccess ? statblockQuery.data : null;
    const statblockId = member?.partyStatblockId.toString();

    const buyItem = useBuyPartyItem(partyId ?? -1, member?.statblock?.slug ?? "");

    useEffect(() => {
        if (!member && members && members.length > 0) {
            setMember(members[0]);
        }
    }, [members, member]);

    if (!token) {
        return (
            <div className={shopStyles.noItems} style={{ marginTop: "2rem" }}>
                Select a single token to view its shop
            </div>
        );
    }

    if (!data || !data.shopAvailable) {
        return (
            <>
                <ShopHeader showClose={false} />
                <div className={shopStyles.noItems} style={{ marginTop: "2rem" }}>
                    Shop is currently closed
                </div>
            </>
        );
    }

    const myCart = statblockId ? data.cart[statblockId] : null;
    const cartItemCount = myCart?.items.length || 0;

    const handleAddToCart = async (item: ShopItemType) => {
        if (!statblockId) return;

        const updatedCart = { ...data.cart };
        const currentCart = {
            ...(updatedCart[statblockId] || { items: [], price: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 } }),
        };

        // Check stock
        if (item.count !== undefined) {
            const inCartCount = currentCart.items.filter((i) => i.id === item.id).length;
            if (inCartCount >= item.count) {
                alert("Out of stock!");
                return;
            }
        }

        currentCart.items = [...currentCart.items, item];
        currentCart.price = {
            pp: (currentCart.price.pp || 0) + (item.money.pp || 0),
            gp: (currentCart.price.gp || 0) + (item.money.gp || 0),
            ep: (currentCart.price.ep || 0) + (item.money.ep || 0),
            sp: (currentCart.price.sp || 0) + (item.money.sp || 0),
            cp: (currentCart.price.cp || 0) + (item.money.cp || 0),
        };

        updatedCart[statblockId] = currentCart;
        await updateShopMetadata({ ...data, cart: updatedCart }, [token.id]);
    };

    const handleRemoveFromCart = async (index: number) => {
        if (!statblockId || !myCart) return;

        const updatedCart = { ...data.cart };
        const currentCart = { ...myCart };
        const item = currentCart.items[index];

        currentCart.items = currentCart.items.filter((_, i) => i !== index);
        currentCart.price = {
            pp: (currentCart.price.pp || 0) - (item.money.pp || 0),
            gp: (currentCart.price.gp || 0) - (item.money.gp || 0),
            ep: (currentCart.price.ep || 0) - (item.money.ep || 0),
            sp: (currentCart.price.sp || 0) - (item.money.sp || 0),
            cp: (currentCart.price.cp || 0) - (item.money.cp || 0),
        };

        updatedCart[statblockId] = currentCart;
        await updateShopMetadata({ ...data, cart: updatedCart }, [token.id]);
    };

    const handleBuy = async () => {
        if (!statblockId || !myCart || !partyId || !member) return;

        try {
            const transactionItems = myCart.items.reduce(
                (acc, item) => {
                    const existing = acc.find((i) => i.item_id === item.id);
                    if (existing) {
                        existing.count += 1;
                    } else {
                        acc.push({ item_id: item.id, count: 1 });
                    }
                    return acc;
                },
                [] as { item_id: number; count: number }[],
            );

            await buyItem.mutateAsync({
                partyStatblockId: member.partyStatblockId,
                data: {
                    cost: myCart.price,
                    buy: transactionItems,
                    sell: [],
                },
            });

            // Update shop stock
            const updatedShopItems = [...data.items];
            myCart.items.forEach((cartItem) => {
                const shopItemIndex = updatedShopItems.findIndex((si) => si.id === cartItem.id);
                if (shopItemIndex >= 0 && updatedShopItems[shopItemIndex].count !== undefined) {
                    updatedShopItems[shopItemIndex] = {
                        ...updatedShopItems[shopItemIndex],
                        count: Math.max(0, updatedShopItems[shopItemIndex].count! - 1),
                    };
                }
            });

            // Clear cart
            const updatedCart = { ...data.cart };
            delete updatedCart[statblockId];

            await updateShopMetadata({ ...data, items: updatedShopItems, cart: updatedCart }, [token.id]);
            setView("items");
            alert("Purchase successful!");
        } catch (e: any) {
            console.error(e);
            alert(`Purchase failed: ${e?.response?.data?.detail ?? e?.message ?? "Unknown error"}`);
        }
    };

    return (
        <>
            <ShopHeader showClose={false} />
            {member ? (
                <div>
                    Customer:
                    {member.imageUrl ? (
                        <img src={member.imageUrl} alt={member.statblock?.name} className={shopStyles.memberAvatar} />
                    ) : null}
                    {statblockQuery.isSuccess && statblock && (
                        <MoneyDisplay
                            money={statblock.money ? setNullToZero(statblock.money) : undefined}
                            freeText="0cp"
                        />
                    )}
                </div>
            ) : (
                <p style={{ fontWeight: "bold" }}>
                    You currently have no party member assigned, ask your GM to assign you a party member to buy items
                    from this shops and add them to your inventory directly.
                </p>
            )}
            <div className={shopStyles.section}>
                <div className={shopStyles.sectionHeader}>
                    <h2 className={shopStyles.sectionTitle}>{view === "items" ? "Inventory" : "My Cart"}</h2>
                    <div className={shopStyles.actions}>
                        <Tippy content={view === "items" ? "View Cart" : "View Inventory"}>
                            <button
                                className={shopStyles.addButton}
                                onClick={() => setView(view === "items" ? "cart" : "items")}
                            >
                                <div style={{ position: "relative" }}>
                                    {view === "items" ? <ShoppingCart /> : <ShoppingBag />}
                                    {cartItemCount > 0 && (
                                        <span
                                            style={{
                                                position: "absolute",
                                                top: "-8px",
                                                right: "-8px",
                                                background: "#448844",
                                                borderRadius: "50%",
                                                width: "16px",
                                                height: "16px",
                                                fontSize: "10px",
                                                display: "flex",
                                                justifyContent: "center",
                                                alignItems: "center",
                                                color: "white",
                                            }}
                                        >
                                            {cartItemCount}
                                        </span>
                                    )}
                                </div>
                            </button>
                        </Tippy>
                    </div>
                </div>

                {view === "items" ? (
                    <ShopItems
                        items={data.items}
                        token={token}
                        data={data}
                        readOnly={true}
                        onAddToCart={member ? handleAddToCart : undefined}
                    />
                ) : (
                    <div className={shopStyles.cartView}>
                        {cartItemCount === 0 ? (
                            <div className={shopStyles.noItems}>Your cart is empty</div>
                        ) : (
                            <>
                                <div className={shopStyles.cartItemsList}>
                                    {myCart!.items.map((item, idx) => (
                                        <div key={idx} className={shopStyles.itemRow}>
                                            <div className={shopStyles.itemName}>{item.name}</div>
                                            <div className={shopStyles.itemActions}>
                                                <MoneyDisplay money={item.money} className={shopStyles.itemPrice} />
                                                <button
                                                    className={shopStyles.itemButton}
                                                    onClick={() => handleRemoveFromCart(idx)}
                                                >
                                                    <DeleteOutline fontSize="small" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div
                                    className={shopStyles.cartFooter}
                                    style={{
                                        marginTop: "1rem",
                                        padding: "1rem",
                                        borderTop: "1px solid rgba(255,255,255,0.1)",
                                    }}
                                >
                                    <h3
                                        style={{
                                            marginBottom: "1rem",
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "1ch",
                                        }}
                                    >
                                        Total: <MoneyDisplay money={myCart!.price} freeText="0cp" />
                                    </h3>
                                    <button
                                        className={"button"}
                                        style={{
                                            width: "100%",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            gap: "1ch",
                                        }}
                                        onClick={handleBuy}
                                        disabled={buyItem.isPending}
                                    >
                                        <CheckCircle fontSize="small" />
                                        {buyItem.isPending ? "Processing..." : "Confirm Purchase"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};
