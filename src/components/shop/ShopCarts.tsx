import { ShopMetadata, Money } from "../../helper/types.ts";
import { Item } from "@owlbear-rodeo/sdk";
import shopStyles from "./shop.module.scss";
import { updateShopMetadata } from "../../helper/tokenHelper.ts";
import { useForm } from "react-hook-form";
import { CheckRounded, CloseRounded, Edit } from "@mui/icons-material";
import { useState } from "react";
import styles from "../party/party-inventory.module.scss";
import { usePartyStore } from "../../context/PartyStore.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useGetParty } from "../../api/tabletop-almanac/useParty.ts";

export const ShopCart = ({
    statblockId,
    cart,
    token,
    data,
}: {
    statblockId: string;
    cart: { items: any[]; price: Money };
    token: Item;
    data: ShopMetadata;
}) => {
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const form = useForm<Money>({ defaultValues: cart.price });
    const partyId = useMetadataContext((state) => state.room?.partyId);
    const { data: party } = useGetParty(partyId);
    
    const sb = party?.statblocks?.find(s => s.id.toString() === statblockId);
    const ownerName = sb?.statblock?.name || `Statblock: ${statblockId}`;

    const handleUpdatePrice = async (newPrice: Money) => {
        const updatedCart = { ...data.cart };
        updatedCart[statblockId] = { ...cart, price: newPrice };
        await updateShopMetadata({ ...data, cart: updatedCart }, [token.id]);
        setIsEditingPrice(false);
    };

    const formatMoney = (money: Money) => {
        const parts = [];
        if (money.pp) parts.push(`${money.pp}pp`);
        if (money.gp) parts.push(`${money.gp}gp`);
        if (money.ep) parts.push(`${money.ep}ep`);
        if (money.sp) parts.push(`${money.sp}sp`);
        if (money.cp) parts.push(`${money.cp}cp`);
        return parts.length > 0 ? parts.join(" ") : "0cp";
    };

    return (
        <div className={shopStyles.cartRow}>
            <div className={shopStyles.cartHeader}>
                <span className={shopStyles.cartOwner}>{ownerName}</span>
                {!isEditingPrice ? (
                    <div className={shopStyles.cartPriceRow}>
                        <span className={shopStyles.cartPrice}>Total: {formatMoney(cart.price)}</span>
                        <button className={shopStyles.editButton} onClick={() => setIsEditingPrice(true)}>
                            <Edit fontSize="small" />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={form.handleSubmit(handleUpdatePrice)} className={styles.moneyEditForm}>
                         <div className={styles.moneyInputList}>
                            {(["pp", "gp", "ep", "sp", "cp"] as const).map((currency) => (
                                <div key={currency} className={styles.moneyInput}>
                                    <label className={styles[currency]}>{currency}</label>
                                    <input
                                        type="number"
                                        min={0}
                                        {...form.register(currency, {
                                            valueAsNumber: true,
                                            min: 0,
                                        })}
                                    />
                                </div>
                            ))}
                        </div>
                        <div style={{ display: "flex", gap: "0.5ch" }}>
                            <button type="submit" className={shopStyles.confirmButton}><CheckRounded fontSize="small" /></button>
                            <button type="button" className={shopStyles.cancelButton} onClick={() => setIsEditingPrice(false)}><CloseRounded fontSize="small" /></button>
                        </div>
                    </form>
                )}
            </div>
            <div className={shopStyles.cartItems}>
                {cart.items.map((item, idx) => (
                    <div key={idx} className={shopStyles.cartItem}>
                        {item.name} ({formatMoney(item.money)})
                    </div>
                ))}
            </div>
        </div>
    );
};

export const ShopCarts = ({
    token,
    data,
}: {
    token: Item;
    data: ShopMetadata;
}) => {
    const cartEntries = Object.entries(data.cart || {});

    if (cartEntries.length === 0) {
        return <div className={shopStyles.noCarts}>No active carts</div>;
    }

    return (
        <div className={shopStyles.cartsList}>
            {cartEntries.map(([statblockId, cart]) => (
                <ShopCart
                    key={statblockId}
                    statblockId={statblockId}
                    cart={cart}
                    token={token}
                    data={data}
                />
            ))}
        </div>
    );
};
