import { useShopTokenContext } from "../../context/ShopTokenContext.tsx";
import { MoneyEditInputs } from "../money/MoneyEditInputs.tsx";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Money, ShopMetadata } from "../../helper/types.ts";
import { updateShopMetadata } from "../../helper/tokenHelper.ts";
import shopStyles from "./shop.module.scss";
import styles from "../party/party-inventory.module.scss";
import { MoneyDisplay } from "../money/MoneyDisplay.tsx";
import { EditButton } from "../form/EditButton.tsx";
import { SubmitButton } from "../form/SubmitButton.tsx";
import { CancelButton } from "../form/CancelButton.tsx";

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
    const [error, setError] = useState<string | null>(null);
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
        await updateShopMetadata((currentData) => ({ ...currentData, money: formData }), [tokenId]);
        setEdit(false);
    };

    return (
        <div className={shopStyles.section}>
            <div className={shopStyles.sectionHeader}>
                <h2 className={shopStyles.sectionTitle}>Edit Shop Funds</h2>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className={styles.addForm}>
                {error && (
                    <div
                        style={{
                            backgroundColor: "rgba(255, 0, 0, 0.1)",
                            color: "#ff4444",
                            padding: "8px",
                            borderRadius: "4px",
                            marginBottom: "8px",
                            fontSize: "0.8rem",
                            textAlign: "center",
                            border: "1px solid rgba(255, 0, 0, 0.2)",
                        }}
                    >
                        {error}
                    </div>
                )}
                <div className={styles.moneyEditForm} style={{ marginBottom: "1rem" }}>
                    <MoneyEditInputs form={form} originalMoney={data.money} onError={setError} />
                </div>
                <div className={styles.buttonGroup}>
                    <SubmitButton form={form} pending={form.formState.isSubmitting} />
                    <CancelButton onClick={() => setEdit(false)} />
                </div>
            </form>
        </div>
    );
};
