import { MoneyDisplay } from "../money/MoneyDisplay.tsx";
import { DeleteOutline, CheckCircle, WarningAmber } from "@mui/icons-material";
import shopStyles from "./shop.module.scss";
import { Money, ShopCartEntry } from "../../helper/types.ts";
import { normalizeToCP, scaleMoney, subtractMoney, toCP } from "../../helper/moneyHelpers.ts";

const zeroMoney: Money = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };

interface ShopPlayerCartProps {
    cart: ShopCartEntry | null;
    shopMoney: Money;
    onRemove: (index: number) => void;
    onRemoveSell: (index: number) => void;
    onCheckout: () => void;
    isCheckingOut: boolean;
}

export const ShopPlayerCart = ({
    cart,
    shopMoney,
    onRemove,
    onRemoveSell,
    onCheckout,
    isCheckingOut,
}: ShopPlayerCartProps) => {
    const buyItems = cart?.items ?? [];
    const sellItems = cart?.sellItems ?? [];

    if (buyItems.length === 0 && sellItems.length === 0) {
        return <div className={shopStyles.noItems}>Your cart is empty</div>;
    }

    const buyPrice = cart?.price ?? zeroMoney;
    const sellPrice = cart?.sellPrice ?? zeroMoney;
    const net = subtractMoney(buyPrice, sellPrice);
    const netCP = toCP(net);
    const payoutCP = -netCP;
    const shopShort = payoutCP > toCP(shopMoney);
    const displayNet = normalizeToCP(netCP >= 0 ? net : scaleMoney(net, -1));

    return (
        <div className={shopStyles.cartView}>
            {buyItems.length > 0 && (
                <div className={shopStyles.cartSection}>
                    <h3 className={shopStyles.cartSectionTitle}>Buying</h3>
                    <div className={shopStyles.cartItemsList}>
                        {buyItems.map((item, idx) => (
                            <div key={idx} className={shopStyles.itemRow}>
                                <div className={shopStyles.itemName}>{item.name}</div>
                                <div className={shopStyles.itemActions}>
                                    <MoneyDisplay money={item.money} className={shopStyles.itemPrice} />
                                    <button
                                        className={shopStyles.itemButton}
                                        onClick={() => onRemove(idx)}
                                        title="Remove from cart"
                                    >
                                        <DeleteOutline fontSize="small" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={shopStyles.cartSubtotal}>
                        Subtotal: <MoneyDisplay money={buyPrice} freeText="0cp" />
                    </div>
                </div>
            )}

            {sellItems.length > 0 && (
                <div className={shopStyles.cartSection}>
                    <h3 className={shopStyles.cartSectionTitle}>Selling</h3>
                    <div className={shopStyles.cartItemsList}>
                        {sellItems.map((item, idx) => (
                            <div key={idx} className={shopStyles.itemRow}>
                                <div className={shopStyles.itemName}>
                                    {item.count} x {item.name}
                                </div>
                                <div className={shopStyles.itemActions}>
                                    <MoneyDisplay
                                        money={scaleMoney(item.unitPrice, item.count)}
                                        className={shopStyles.itemPrice}
                                    />
                                    <button
                                        className={shopStyles.itemButton}
                                        onClick={() => onRemoveSell(idx)}
                                        title="Remove from cart"
                                    >
                                        <DeleteOutline fontSize="small" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className={shopStyles.cartSubtotal}>
                        Subtotal: <MoneyDisplay money={sellPrice} freeText="0cp" />
                    </div>
                </div>
            )}

            <div className={shopStyles.cartFooter}>
                <div className={shopStyles.cartNetRow}>
                    {netCP >= 0 ? "You pay: " : "You receive: "}
                    <MoneyDisplay money={displayNet} freeText="0cp" />
                </div>
                {shopShort && (
                    <div className={shopStyles.shortfallWarning}>
                        <WarningAmber fontSize="small" />
                        The shop can&apos;t afford this trade right now.
                    </div>
                )}
                <button
                    className={`button ${shopStyles.checkoutButton}`}
                    onClick={onCheckout}
                    disabled={isCheckingOut || shopShort}
                >
                    <CheckCircle fontSize="small" />
                    {isCheckingOut ? "Processing..." : "Confirm"}
                </button>
            </div>
        </div>
    );
};
