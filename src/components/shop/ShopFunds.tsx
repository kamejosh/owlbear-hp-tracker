import { useShopTokenContext } from "../../context/ShopTokenContext.tsx";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Money, ShopMetadata } from "../../helper/types.ts";
import { updateShopMetadata } from "../../helper/tokenHelper.ts";
import shopStyles from "./shop.module.scss";
import styles from "../party/party-inventory.module.scss";
import { MoneyDisplay } from "../money/MoneyDisplay.tsx";
import { Tooltip } from "@mui/material";
import { EditButton } from "../form/EditButton.tsx";
import { SubmitButton } from "../form/SubmitButton.tsx";
import { CancelButton } from "../form/CancelButton.tsx";

const currencyNames = {
    pp: "Platinum Pieces",
    gp: "Gold Pieces",
    ep: "Electrum Pieces",
    sp: "Silver Pieces",
    cp: "Copper Pieces",
};

export const ShopFunds = () => {
    const data = useShopTokenContext((state) => state.data);
    const token = useShopTokenContext((state) => state.token);
    const [isEditing, setIsEditing] = useState(false);

    if (!data || !token) return null;

    if (isEditing) {
        return <EditShopFunds data={data} tokenId={token.id} setEdit={setIsEditing} />;
    }

    return (
        <div className={shopStyles.section}>
            <div className={shopStyles.sectionHeader}>
                <h2 className={shopStyles.sectionTitle}>Shop Funds</h2>
                <div className={shopStyles.actions}>
                    <EditButton onClick={() => setIsEditing(true)} alignCenter={true} />
                </div>
            </div>
            <div className={shopStyles.moneyContainer}>
                <MoneyDisplay money={data.money} freeText="0cp" />
            </div>
        </div>
    );
};

const EditShopFunds = ({
    data,
    tokenId,
    setEdit,
}: {
    data: ShopMetadata;
    tokenId: string;
    setEdit: (edit: boolean) => void;
}) => {
    const form = useForm<Money>({
        defaultValues: {
            pp: data.money?.pp ?? 0,
            gp: data.money?.gp ?? 0,
            ep: data.money?.ep ?? 0,
            sp: data.money?.sp ?? 0,
            cp: data.money?.cp ?? 0,
        },
    });

    const onSubmit = async (formData: Money) => {
        await updateShopMetadata({ ...data, money: formData }, [tokenId]);
        setEdit(false);
    };

    return (
        <div className={shopStyles.section}>
            <div className={shopStyles.sectionHeader}>
                <h2 className={shopStyles.sectionTitle}>Edit Shop Funds</h2>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className={styles.addForm}>
                <div className={styles.moneyEditForm} style={{ marginBottom: "1rem" }}>
                    <div className={styles.moneyInputList}>
                        {(["pp", "gp", "ep", "sp", "cp"] as const).map((currency) => {
                            return (
                                <div key={currency} className={styles.moneyInput}>
                                    <Tooltip title={currencyNames[currency]} arrow>
                                        <label className={`${styles.costItem} ${styles[currency]}`}>{currency}</label>
                                    </Tooltip>
                                    <input
                                        type="number"
                                        min={0}
                                        {...form.register(currency, {
                                            valueAsNumber: true,
                                            min: 0,
                                        })}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div className={styles.buttonGroup}>
                    <SubmitButton form={form} pending={form.formState.isSubmitting} />
                    <CancelButton onClick={() => setEdit(false)} />
                </div>
            </form>
        </div>
    );
};
