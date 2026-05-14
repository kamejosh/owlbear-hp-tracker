import { MoneyDisplay } from "../money/MoneyDisplay.tsx";
import { DeleteOutline, CheckCircle } from "@mui/icons-material";
import shopStyles from "./shop.module.scss";
import { Money, ShopItemType } from "../../helper/types.ts";
import { Box, Typography } from "@mui/material";

interface ShopPlayerCartProps {
    cart: { items: ShopItemType[]; price: Money } | null;
    onRemove: (index: number) => void;
    onBuy: () => void;
    isBuying: boolean;
}

export const ShopPlayerCart = ({ cart, onRemove, onBuy, isBuying }: ShopPlayerCartProps) => {
    const cartItemCount = cart?.items.length || 0;

    if (cartItemCount === 0) {
        return <div className={shopStyles.noItems}>Your cart is empty</div>;
    }

    return (
        <div className={shopStyles.cartView}>
            <div className={shopStyles.cartItemsList}>
                {cart!.items.map((item, idx) => (
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
            <Box
                className={shopStyles.cartFooter}
                sx={{
                    marginTop: "1rem",
                    padding: "1rem",
                    borderTop: "1px solid rgba(255,255,255,0.1)",
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        marginBottom: "1rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "1ch",
                        fontWeight: "bold",
                    }}
                >
                    Total: <MoneyDisplay money={cart!.price} freeText="0cp" />
                </Typography>
                <button
                    className={"button"}
                    style={{
                        width: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "1ch",
                    }}
                    onClick={onBuy}
                    disabled={isBuying}
                >
                    <CheckCircle fontSize="small" />
                    {isBuying ? "Processing..." : "Confirm Purchase"}
                </button>
            </Box>
        </div>
    );
};
