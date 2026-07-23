import { ShopMetadata, Money, ShopCartEntry } from "../../helper/types.ts";
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
import { addMoney, formatCP, normalizeToCP, scaleMoney, setNullToZero, subtractMoney, toCP } from "../../helper/moneyHelpers.ts";
import { useE5GetStatblock } from "../../api/e5/useE5Api.ts";
import Tippy from "@tippyjs/react";
import { CancelButton } from "../form/CancelButton.tsx";
import { SubmitButton } from "../form/SubmitButton.tsx";

const zeroMoney: Money = { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };

export const ShopCart = ({
    statblockId,
    cart,
    token,
    data,
}: {
    statblockId: string;
    cart: ShopCartEntry;
    token: Item;
    data: ShopMetadata;
}) => {
    const [isEditingPrice, setIsEditingPrice] = useState(false);
    const [isEditingSellPrice, setIsEditingSellPrice] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const apiKey = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);
    const form = useForm<Money>({ defaultValues: cart.price });
    const sellForm = useForm<Money>({ defaultValues: cart.sellPrice ?? zeroMoney });
    const partyId = useMetadataContext((state) => state.room?.partyId);
    const { data: party } = useGetParty(partyId);

    const sb = party?.statblocks?.find((s) => s.id.toString() === statblockId);

    const statblockQuery = useE5GetStatblock(sb?.statblock?.slug ?? "", apiKey ?? "");
    const ownerName = sb?.statblock?.name ?? `Statblock: ${statblockId}`;

    const statblock = statblockQuery.isSuccess ? statblockQuery.data : null;
    const ownerMoney = statblock?.money ? setNullToZero(statblock.money) : zeroMoney;

    const sellItems = cart.sellItems ?? [];
    const sellPrice = cart.sellPrice ?? zeroMoney;

    const ownerTotalCP = toCP(ownerMoney);
    const cartTotalCP = toCP(cart.price);
    const diffCP = ownerTotalCP - cartTotalCP;
    const isShort = diffCP < 0;

    const shopMoney = setNullToZero(data.money);
    const net = subtractMoney(cart.price, sellPrice);
    const payoutCP = -toCP(net);
    const tillShortCP = payoutCP - toCP(shopMoney);
    const isTillShort = tillShortCP > 0;

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
        const recalculatedPrice = cart.items.reduce((acc, item) => addMoney(acc, item.money), zeroMoney);
        await handleUpdatePrice(normalizeToCP(recalculatedPrice));
    };

    const handleUpdateSellPrice = async (newPrice: Money) => {
        await updateShopMetadata(
            (currentData) => {
                const updatedCart = { ...currentData.cart };
                updatedCart[statblockId] = { ...currentData.cart[statblockId], sellPrice: newPrice };
                return { ...currentData, cart: updatedCart };
            },
            [token.id],
        );
        setIsEditingSellPrice(false);
    };

    const handleResetSellPrice = async () => {
        const recalculatedPrice = sellItems.reduce(
            (acc, item) => addMoney(acc, scaleMoney(item.unitPrice, item.count)),
            zeroMoney,
        );
        await handleUpdateSellPrice(normalizeToCP(recalculatedPrice));
    };

    return (
        <div className={shopStyles.cartRow}>
            <div className={shopStyles.cartHeader}>
                <span className={shopStyles.cartOwner}>{ownerName}</span>
            </div>

            <div className={shopStyles.cartMeta}>
                <div className={shopStyles.cartMetaItem}>
                    <AccountBalanceWallet fontSize="inherit" />
                    <span>Available:</span>
                    <MoneyDisplay money={ownerMoney} />
                </div>
                {isShort && (
                    <div className={`${shopStyles.cartMetaItem} ${shopStyles.warningText}`}>
                        <WarningAmber fontSize="inherit" />
                        <span>Missing: {formatCP(Math.abs(diffCP))}</span>
                    </div>
                )}
            </div>

            {cart.items.length > 0 && (
                <>
                    <div className={shopStyles.cartHr} />
                    <div className={shopStyles.cartSubsectionHeader}>
                        <span className={shopStyles.cartSubsectionTitle}>Buying</span>
                        {!isEditingPrice ? (
                            <div className={shopStyles.cartPriceRow}>
                                <span className={shopStyles.cartPrice}>
                                    Total: <MoneyDisplay money={cart.price} />
                                </span>
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
                        ) : (
                            <form onSubmit={form.handleSubmit(handleUpdatePrice)} className={styles.moneyEditForm}>
                                {error && <div className={shopStyles.errorContainer}>{error}</div>}
                                <MoneyEditInputs form={form} originalMoney={cart.price} onError={setError} />
                                <div className={shopStyles.editActions}>
                                    <SubmitButton form={form} pending={false} />
                                    <CancelButton onClick={() => setIsEditingPrice(false)} />
                                </div>
                            </form>
                        )}
                    </div>
                    <div className={shopStyles.cartItems}>
                        {cart.items.map((item, idx) => (
                            <div key={idx} className={shopStyles.cartItem}>
                                {item.name} (<MoneyDisplay money={item.money} />)
                            </div>
                        ))}
                    </div>
                </>
            )}

            {sellItems.length > 0 && (
                <>
                    <div className={shopStyles.cartHr} />
                    <div className={shopStyles.cartSubsectionHeader}>
                        <span className={shopStyles.cartSubsectionTitle}>Selling</span>
                        {!isEditingSellPrice ? (
                            <div className={shopStyles.cartPriceRow}>
                                <span className={shopStyles.cartPrice}>
                                    Total: <MoneyDisplay money={sellPrice} />
                                </span>
                                <Tippy content="Edit price">
                                    <button
                                        className={shopStyles.editButton}
                                        onClick={() => setIsEditingSellPrice(true)}
                                    >
                                        <Edit fontSize="small" />
                                    </button>
                                </Tippy>
                                <Tippy content="Reset price to total items offer">
                                    <button className={shopStyles.editButton} onClick={handleResetSellPrice}>
                                        <RestartAlt fontSize="small" />
                                    </button>
                                </Tippy>
                            </div>
                        ) : (
                            <form
                                onSubmit={sellForm.handleSubmit(handleUpdateSellPrice)}
                                className={styles.moneyEditForm}
                            >
                                {error && <div className={shopStyles.errorContainer}>{error}</div>}
                                <MoneyEditInputs form={sellForm} originalMoney={sellPrice} onError={setError} />
                                <div className={shopStyles.editActions}>
                                    <SubmitButton form={sellForm} pending={false} />
                                    <CancelButton onClick={() => setIsEditingSellPrice(false)} />
                                </div>
                            </form>
                        )}
                    </div>
                    <div className={shopStyles.cartItems}>
                        {sellItems.map((item, idx) => (
                            <div key={idx} className={shopStyles.cartItem}>
                                {item.count} x {item.name} (<MoneyDisplay money={scaleMoney(item.unitPrice, item.count)} />)
                            </div>
                        ))}
                    </div>
                </>
            )}

            {isTillShort && (
                <>
                    <div className={shopStyles.cartHr} />
                    <div className={shopStyles.shortfallWarning}>
                        <WarningAmber fontSize="small" />
                        Shop till short by {formatCP(tillShortCP)}
                    </div>
                </>
            )}
        </div>
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
