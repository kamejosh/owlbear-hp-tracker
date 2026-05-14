import { ShopMetadata, Money } from "../../helper/types.ts";
import { MoneyEditInputs } from "../money/MoneyEditInputs.tsx";
import { Item } from "@owlbear-rodeo/sdk";
import shopStyles from "./shop.module.scss";
import { updateShopMetadata } from "../../helper/tokenHelper.ts";
import { useForm } from "react-hook-form";
import { Edit, AccountBalanceWallet, WarningAmber, RestartAlt } from "@mui/icons-material";
import { useState } from "react";
import styles from "../party/party-inventory.module.scss";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useGetParty } from "../../api/tabletop-almanac/useParty.ts";
import { MoneyDisplay } from "../money/MoneyDisplay.tsx";
import { toCP, formatCP, setNullToZero, normalizeToCP } from "../../helper/moneyHelpers.ts";
import { Box, Typography, Divider } from "@mui/material";
import { useE5GetStatblock } from "../../api/e5/useE5Api.ts";
import Tippy from "@tippyjs/react";
import { CancelButton } from "../form/CancelButton.tsx";
import { SubmitButton } from "../form/SubmitButton.tsx";

export const ShopCart = ({
    statblockId,
    cart,
    token,
}: {
    statblockId: string;
    cart: { items: any[]; price: Money };
    token: Item;
    data: ShopMetadata;
}) => {
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const apiKey = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);
    const form = useForm<Money>({ defaultValues: cart.price });
    const partyId = useMetadataContext((state) => state.room?.partyId);
    const { data: party } = useGetParty(partyId);

    const sb = party?.statblocks?.find((s) => s.id.toString() === statblockId);

    const statblockQuery = useE5GetStatblock(sb?.statblock?.slug ?? "", apiKey ?? "");
    const ownerName = sb?.statblock?.name ?? `Statblock: ${statblockId}`;

    const statblock = statblockQuery.isSuccess ? statblockQuery.data : null;
    const ownerMoney = statblock?.money ? setNullToZero(statblock.money) : { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };

    const ownerTotalCP = toCP(ownerMoney);
    const cartTotalCP = toCP(cart.price);
    const diffCP = ownerTotalCP - cartTotalCP;
    const isShort = diffCP < 0;

    const handleUpdatePrice = async (newPrice: Money) => {
        await updateShopMetadata(
            (currentData) => {
                const updatedCart = { ...currentData.cart };
                updatedCart[statblockId] = { ...currentData.cart[statblockId], price: newPrice };
                return { ...currentData, cart: updatedCart };
            },
            [token.id],
        );
        setIsEditingPrice(false);
    };

    const handleResetPrice = async () => {
        const recalculatedPrice = cart.items.reduce(
            (acc, item) => {
                return {
                    pp: (acc.pp || 0) + (item.money.pp || 0),
                    gp: (acc.gp || 0) + (item.money.gp || 0),
                    ep: (acc.ep || 0) + (item.money.ep || 0),
                    sp: (acc.sp || 0) + (item.money.sp || 0),
                    cp: (acc.cp || 0) + (item.money.cp || 0),
                };
            },
            { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
        );

        await handleUpdatePrice(normalizeToCP(recalculatedPrice));
    };

    return (
        <Box
            className={shopStyles.cartRow}
            sx={{
                mb: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
            }}
        >
            <div className={shopStyles.cartHeader}>
                <span className={shopStyles.cartOwner}>{ownerName}</span>
                {!isEditingPrice ? (
                    <div className={shopStyles.cartPriceRow}>
                        <span className={shopStyles.cartPrice}>
                            Total: <MoneyDisplay money={cart.price} />
                        </span>
                        <div style={{ display: "flex", gap: "0.5ch", alignItems: "center" }}>
                            <Tippy content="Edit price">
                                <button className={shopStyles.editButton} onClick={() => setIsEditingPrice(true)}>
                                    <Edit fontSize="small" />
                                </button>
                            </Tippy>
                            <Tippy content="Reset price to total items cost">
                                <button className={shopStyles.editButton} onClick={handleResetPrice}>
                                    <RestartAlt fontSize="small" />
                                </button>
                            </Tippy>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5ch" }}>
                        <form onSubmit={form.handleSubmit(handleUpdatePrice)} className={styles.moneyEditForm}>
                            {error && (
                                <div
                                    style={{
                                        backgroundColor: "rgba(255, 0, 0, 0.1)",
                                        color: "#ff4444",
                                        padding: "4px",
                                        borderRadius: "4px",
                                        fontSize: "0.7rem",
                                        textAlign: "center",
                                        border: "1px solid rgba(255, 0, 0, 0.2)",
                                    }}
                                >
                                    {error}
                                </div>
                            )}
                            <MoneyEditInputs form={form} originalMoney={cart.price} onError={setError} />
                            <div style={{ display: "flex", gap: "0.5ch" }}>
                                <SubmitButton form={form} pending={false} />
                                <CancelButton onClick={() => setIsEditingPrice(false)} />
                            </div>
                        </form>
                    </div>
                )}
            </div>

            <Box sx={{ mt: 1, mb: 1, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", opacity: 0.8 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <AccountBalanceWallet fontSize="inherit" />
                    <Typography variant="caption">Available:</Typography>
                    <MoneyDisplay money={ownerMoney} />
                </Box>
                {isShort && (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "#ff4444" }}>
                        <WarningAmber fontSize="inherit" />
                        <Typography variant="caption" fontWeight="bold">
                            Missing: {formatCP(Math.abs(diffCP))}
                        </Typography>
                    </Box>
                )}
            </Box>

            <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.05)" }} />

            <div className={shopStyles.cartItems}>
                {cart.items.map((item, idx) => (
                    <div key={idx} className={shopStyles.cartItem}>
                        {item.name} (<MoneyDisplay money={item.money} />)
                    </div>
                ))}
            </div>
        </Box>
    );
};

export const ShopCarts = ({ token, data }: { token: Item; data: ShopMetadata }) => {
    const cartEntries = Object.entries(data.cart || {});

    if (cartEntries.length === 0) {
        return <div className={shopStyles.noCarts}>No active carts</div>;
    }

    return (
        <div className={shopStyles.cartsList}>
            {cartEntries.map(([statblockId, cart]) => (
                <ShopCart key={statblockId} statblockId={statblockId} cart={cart} token={token} data={data} />
            ))}
        </div>
    );
};
