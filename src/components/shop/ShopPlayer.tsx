import { useShopTokenContext } from "../../context/ShopTokenContext.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import { PartyStoreStatblock, usePartyStore } from "../../context/PartyStore.tsx";
import { ShopItems } from "./ShopItems.tsx";
import { ShopPlayerSell } from "./ShopPlayerSell.tsx";
import shopStyles from "./shop.module.scss";
import { useBuyPartyItem } from "../../api/tabletop-almanac/useParty.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { Money, ShopItemType, ShopSellItemType } from "../../helper/types.ts";
import { StatblockItems } from "../../helper/equipmentHelpers.ts";
import { updateShopMetadata } from "../../helper/tokenHelper.ts";
import { ShoppingCart, ShoppingBag, Sell } from "@mui/icons-material";
import { Badge, Snackbar, Alert } from "@mui/material";
import { useEffect, useState } from "react";
import { ShopPlayerCart } from "./ShopPlayerCart.tsx";
import { ShopCustomerSelect } from "./ShopCustomerSelect.tsx";
import { ShopHeader } from "./ShopHeader.tsx";
import Tippy from "@tippyjs/react";
import { useE5GetStatblock } from "../../api/e5/useE5Api.ts";
import {
    addMoney,
    getRandomSellOffer,
    normalizeToCP,
    scaleMoney,
    setNullToZero,
    subtractMoney,
    toCP,
} from "../../helper/moneyHelpers.ts";

const zeroMoney: Money = { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 };

export const ShopPlayer = () => {
    const apiKey = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);
    const data = useShopTokenContext((state) => state.data);
    const token = useShopTokenContext((state) => state.token);
    const playerContext = usePlayerContext();
    const partyId = useMetadataContext((state) => state.room?.partyId);
    const currentParty = usePartyStore((state) => {
        if (!partyId) return null;
        return state.parties.find((p) => p.id === partyId) ?? null;
    });
    const [view, setView] = useState<"items" | "cart" | "sell">("items");
    const [member, setMember] = useState<PartyStoreStatblock | null>(null);
    const [notification, setNotification] = useState<{
        message: string;
        severity: "success" | "error" | "warning" | "info";
    } | null>(null);

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
    const sellItemCount = myCart?.sellItems?.length || 0;

    const handleAddToCart = async (item: ShopItemType) => {
        if (!statblockId) return;

        await updateShopMetadata(
            (currentData) => {
                // Check stock
                const shopItem = currentData.items.find((i) => i.id === item.id);
                if (shopItem && shopItem.count !== undefined && shopItem.count <= 0) {
                    setNotification({ message: "Out of stock!", severity: "warning" });
                    return currentData;
                }

                const updatedCart = { ...currentData.cart };
                const currentCart = {
                    ...(updatedCart[statblockId] || { items: [], price: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 } }),
                };

                currentCart.items = [...currentCart.items, item];
                currentCart.price = {
                    pp: (currentCart.price.pp || 0) + (item.money.pp || 0),
                    gp: (currentCart.price.gp || 0) + (item.money.gp || 0),
                    ep: (currentCart.price.ep || 0) + (item.money.ep || 0),
                    sp: (currentCart.price.sp || 0) + (item.money.sp || 0),
                    cp: (currentCart.price.cp || 0) + (item.money.cp || 0),
                };

                // Update shop items stock
                const updatedItems = [...currentData.items];
                const itemIdx = updatedItems.findIndex((i) => i.id === item.id);
                if (itemIdx >= 0 && updatedItems[itemIdx].count !== undefined) {
                    updatedItems[itemIdx] = {
                        ...updatedItems[itemIdx],
                        count: Math.max(0, updatedItems[itemIdx].count! - 1),
                    };
                }

                updatedCart[statblockId] = currentCart;
                return { ...currentData, items: updatedItems, cart: updatedCart };
            },
            [token.id],
        );
    };

    const handleRemoveFromCart = async (index: number) => {
        if (!statblockId) return;

        await updateShopMetadata(
            (currentData) => {
                const myCart = currentData.cart[statblockId];
                if (!myCart) return currentData;

                const updatedCart = { ...currentData.cart };
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

                // Return item to stock
                const updatedItems = [...currentData.items];
                const itemIdx = updatedItems.findIndex((i) => i.id === item.id);
                if (itemIdx >= 0 && updatedItems[itemIdx].count !== undefined) {
                    updatedItems[itemIdx] = {
                        ...updatedItems[itemIdx],
                        count: updatedItems[itemIdx].count! + 1,
                    };
                }

                updatedCart[statblockId] = currentCart;
                return { ...currentData, items: updatedItems, cart: updatedCart };
            },
            [token.id],
        );
    };

    const handleAddToSellCart = async (equipmentItem: StatblockItems, count: number) => {
        if (!statblockId || !token) return;

        const catalogCost = setNullToZero(equipmentItem.item.cost ?? {});
        const unitPrice = getRandomSellOffer(catalogCost);

        await updateShopMetadata(
            (currentData) => {
                const updatedCart = { ...currentData.cart };
                const currentCart = { ...(updatedCart[statblockId] || { items: [], price: zeroMoney }) };

                const line: ShopSellItemType = {
                    id: equipmentItem.item.id,
                    name: equipmentItem.item.name,
                    slug: equipmentItem.item.slug,
                    count,
                    unitPrice,
                    catalogCost,
                };

                currentCart.sellItems = [...(currentCart.sellItems ?? []), line];
                currentCart.sellPrice = addMoney(currentCart.sellPrice ?? zeroMoney, scaleMoney(unitPrice, count));

                updatedCart[statblockId] = currentCart;
                return { ...currentData, cart: updatedCart };
            },
            [token.id],
        );
    };

    const handleRemoveFromSellCart = async (index: number) => {
        if (!statblockId) return;

        await updateShopMetadata(
            (currentData) => {
                const myCart = currentData.cart[statblockId];
                if (!myCart || !myCart.sellItems) return currentData;

                const updatedCart = { ...currentData.cart };
                const currentCart = { ...myCart };
                const line = currentCart.sellItems![index];

                currentCart.sellItems = currentCart.sellItems!.filter((_, i) => i !== index);
                currentCart.sellPrice = subtractMoney(
                    currentCart.sellPrice ?? zeroMoney,
                    scaleMoney(line.unitPrice, line.count),
                );

                updatedCart[statblockId] = currentCart;
                return { ...currentData, cart: updatedCart };
            },
            [token.id],
        );
    };

    const handleCheckout = async () => {
        if (!statblockId || !myCart || !partyId || !member || !token || !data) return;

        try {
            const buyItems = myCart.items.reduce(
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

            const sellItems = (myCart.sellItems ?? []).reduce(
                (acc, item) => {
                    const existing = acc.find((i) => i.item_id === item.id);
                    if (existing) {
                        existing.count += item.count;
                    } else {
                        acc.push({ item_id: item.id, count: item.count });
                    }
                    return acc;
                },
                [] as { item_id: number; count: number }[],
            );

            const sellPrice = myCart.sellPrice ?? zeroMoney;
            const cost = subtractMoney(myCart.price, sellPrice);
            const payoutCP = toCP(sellPrice) - toCP(myCart.price);

            if (payoutCP > toCP(data.money)) {
                setNotification({
                    message: "The shop doesn't have enough funds to buy these items.",
                    severity: "error",
                });
                return;
            }

            await buyItem.mutateAsync({
                partyStatblockId: member.partyStatblockId,
                data: {
                    cost,
                    buy: buyItems,
                    sell: sellItems,
                },
            });

            // Clear cart (buy-side stock is already updated when added to cart), credit/debit the
            // till, and restock sold items into the shop's own inventory at their catalog price.
            await updateShopMetadata(
                (currentData) => {
                    const updatedCart = { ...currentData.cart };
                    const newMoney = normalizeToCP(addMoney(setNullToZero(currentData.money), cost));

                    const updatedItems = [...currentData.items];
                    (myCart.sellItems ?? []).forEach((line) => {
                        const idx = updatedItems.findIndex((i) => i.id === line.id);
                        if (idx >= 0) {
                            updatedItems[idx] = {
                                ...updatedItems[idx],
                                count: (updatedItems[idx].count ?? 0) + line.count,
                            };
                        } else {
                            updatedItems.push({
                                id: line.id,
                                name: line.name,
                                slug: line.slug,
                                money: line.catalogCost,
                                count: line.count,
                            });
                        }
                    });

                    delete updatedCart[statblockId];
                    return { ...currentData, items: updatedItems, money: newMoney, cart: updatedCart };
                },
                [token.id],
            );

            setView("items");
            setNotification({ message: "Transaction successful!", severity: "success" });
        } catch (e: any) {
            console.error(e);
            setNotification({
                message: `Transaction failed: ${e?.response?.data?.detail ?? e?.message ?? "Unknown error"}`,
                severity: "error",
            });
        }
    };

    return (
        <>
            <ShopHeader showClose={false} />
            <ShopCustomerSelect
                members={members ?? []}
                member={member}
                onMemberChange={setMember}
                statblock={statblock}
                isSuccess={statblockQuery.isSuccess}
            />
            <div className={shopStyles.section}>
                <div className={shopStyles.sectionHeader}>
                    <h2 className={shopStyles.sectionTitle}>
                        {view === "items" ? "Inventory" : view === "sell" ? "Sell Items" : "My Cart"}
                    </h2>
                    <div className={shopStyles.actions}>
                        <Tippy content="Shop Inventory">
                            <button className={shopStyles.addButton} onClick={() => setView("items")}>
                                <ShoppingBag />
                            </button>
                        </Tippy>
                        <Tippy content="Sell Your Items">
                            <button className={shopStyles.addButton} onClick={() => setView("sell")}>
                                <Badge
                                    badgeContent={sellItemCount}
                                    sx={{
                                        "& .MuiBadge-badge": {
                                            backgroundColor: "#448844",
                                            color: "white",
                                        },
                                    }}
                                >
                                    <Sell />
                                </Badge>
                            </button>
                        </Tippy>
                        <Tippy content="My Cart">
                            <button className={shopStyles.addButton} onClick={() => setView("cart")}>
                                <Badge
                                    badgeContent={cartItemCount + sellItemCount}
                                    sx={{
                                        "& .MuiBadge-badge": {
                                            backgroundColor: "#448844",
                                            color: "white",
                                        },
                                    }}
                                >
                                    <ShoppingCart />
                                </Badge>
                            </button>
                        </Tippy>
                    </div>
                </div>

                {view === "items" && (
                    <ShopItems
                        items={data.items}
                        token={token}
                        data={data}
                        readOnly={true}
                        onAddToCart={member ? handleAddToCart : undefined}
                    />
                )}
                {view === "sell" && (
                    <ShopPlayerSell
                        equipment={statblock?.equipment ?? []}
                        cart={myCart ?? null}
                        onAddToSell={handleAddToSellCart}
                    />
                )}
                {view === "cart" && (
                    <ShopPlayerCart
                        cart={myCart ?? null}
                        shopMoney={data.money}
                        onRemove={handleRemoveFromCart}
                        onRemoveSell={handleRemoveFromSellCart}
                        onCheckout={handleCheckout}
                        isCheckingOut={buyItem.isPending}
                    />
                )}
            </div>
            <Snackbar
                open={!!notification}
                autoHideDuration={6000}
                onClose={() => setNotification(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setNotification(null)}
                    severity={notification?.severity}
                    variant="filled"
                    sx={{ width: "100%" }}
                >
                    {notification?.message}
                </Alert>
            </Snackbar>
        </>
    );
};
