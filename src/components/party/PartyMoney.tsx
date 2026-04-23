import { usePartyStore } from "../../context/PartyStore.tsx";
import { useEffect, useState } from "react";
import { MoneyIn, PartyOut, useGetParty, useUpdatePartyMoney } from "../../api/tabletop-almanac/useParty.ts";
import { ID } from "../../helper/variables.ts";
import { EditGroup } from "../form/EditButton.tsx";
import { SubmitButton } from "../form/SubmitButton.tsx";
import { Loader } from "../general/Loader.tsx";
import { useForm } from "react-hook-form";
import styles from "./party-inventory.module.scss";
import { PartyCollapse } from "./PartyCollapse.tsx";
import { formatCP, normalizeToCP, resolveCalculation, toCP } from "../../helper/moneyHelpers.ts";

const PartyMoneyContent = ({ party }: { party: PartyOut | undefined }) => {
    const updateMoney = useUpdatePartyMoney(party?.id || 0, party?.money?.id);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<MoneyIn>({
        defaultValues: {
            pp: party?.money?.pp || 0,
            gp: party?.money?.gp || 0,
            ep: party?.money?.ep || 0,
            sp: party?.money?.sp || 0,
            cp: party?.money?.cp || 0,
        },
    });

    useEffect(() => {
        if (!isEditing && party?.money) {
            form.reset({
                pp: party.money.pp || 0,
                gp: party.money.gp || 0,
                ep: party.money.ep || 0,
                sp: party.money.sp || 0,
                cp: party.money.cp || 0,
            });
        }
    }, [party?.money, isEditing, form]);

    if (!party) {
        return <Loader />;
    }

    const onSubmit = (data: MoneyIn) => {
        const resolvedValues: MoneyIn = {
            pp: resolveCalculation(String(data.pp), party?.money?.pp || 0),
            gp: resolveCalculation(String(data.gp), party?.money?.gp || 0),
            ep: resolveCalculation(String(data.ep), party?.money?.ep || 0),
            sp: resolveCalculation(String(data.sp), party?.money?.sp || 0),
            cp: resolveCalculation(String(data.cp), party?.money?.cp || 0),
        };

        const totalCP = toCP(resolvedValues);

        if (totalCP < 0) {
            const deficit = formatCP(totalCP);
            setError(`Not enough money present (Missing ${deficit})`);
            setTimeout(() => setError(null), 3000);
            return;
        }

        const normalized = normalizeToCP(resolvedValues);

        updateMoney.mutate(normalized, {
            onSuccess: () => setIsEditing(false),
        });
    };

    const currencies: Array<{ key: keyof MoneyIn; label: string }> = [
        { key: "pp", label: "pp" },
        { key: "gp", label: "gp" },
        { key: "ep", label: "ep" },
        { key: "sp", label: "sp" },
        { key: "cp", label: "cp" },
    ];

    const onBlur = (key: keyof MoneyIn) => {
        const input = String(form.getValues(key));
        if (!input) {
            form.setValue(key, (party?.money?.[key] || 0) as any);
            return;
        }

        const currentValue = party?.money?.[key] || 0;
        const resolved = resolveCalculation(input, currentValue);

        const currentFormValues = form.getValues();
        const draftMoney = { ...currentFormValues, [key]: resolved };

        // Convert all keys to numbers for toCP
        const draftMoneyNumeric: MoneyIn = {
            pp: Number(draftMoney.pp) || 0,
            gp: Number(draftMoney.gp) || 0,
            ep: Number(draftMoney.ep) || 0,
            sp: Number(draftMoney.sp) || 0,
            cp: Number(draftMoney.cp) || 0,
        };

        const totalCP = toCP(draftMoneyNumeric);

        if (totalCP < 0) {
            const deficit = formatCP(totalCP);
            setError(`Not enough money present (Missing ${deficit})`);
            setTimeout(() => setError(null), 3000);
            form.setValue(key, currentValue as any);
        } else {
            const normalized = normalizeToCP(draftMoneyNumeric);
            form.reset(normalized);
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, key: keyof MoneyIn) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onBlur(key);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
            <EditGroup heading={null} alignLeft={false} alignCenter={true} onClick={() => setIsEditing(!isEditing)}>
                <div
                    style={{
                        display: "flex",
                        gap: "1.5ch",
                        flexWrap: "wrap",
                        alignItems: "center",
                        padding: "8px",
                        backgroundColor: "rgba(255, 255, 255, 0.03)",
                        borderRadius: "8px",
                    }}
                >
                    {currencies.map((currency) => (
                        <div key={currency.key} style={{ display: "flex", alignItems: "center", gap: "0.5ch" }}>
                            {isEditing ? (
                                <input
                                    type="text"
                                    {...form.register(currency.key)}
                                    onBlur={() => onBlur(currency.key)}
                                    onKeyDown={(e) => onKeyDown(e, currency.key)}
                                    className={styles.costItem + " " + currency.key}
                                    style={{
                                        width: "7ch",
                                        background: "rgba(0, 0, 0, 0.2)",
                                        border: "1px solid rgba(255, 255, 255, 0.1)",
                                        borderRadius: "4px",
                                        color: "inherit",
                                        padding: "4px 6px",
                                        fontSize: "0.9rem",
                                    }}
                                />
                            ) : (
                                <span
                                    className={styles.costItem + " " + currency.key}
                                    style={{ fontWeight: "bold", fontSize: "1rem" }}
                                >
                                    {form.getValues(currency.key) || 0}
                                </span>
                            )}
                            <span
                                className={styles.costItem + " " + styles[currency.key]}
                                style={{ fontSize: "0.8rem", opacity: 0.8, textTransform: "uppercase" }}
                            >
                                {currency.label}
                            </span>
                        </div>
                    ))}
                    {isEditing && (
                        <div style={{ marginLeft: "auto" }}>
                            <SubmitButton form={form} pending={updateMoney.isPending} />
                        </div>
                    )}
                </div>
            </EditGroup>
        </form>
    );
};

export const PartyMoney = () => {
    const currentParty = usePartyStore((state) => state.currentParty);

    const [partyId, setPartyId] = useState<number | undefined>(currentParty?.id);

    const partyQuery = useGetParty(partyId);

    const party = partyQuery.isSuccess ? partyQuery.data : undefined;

    useEffect(() => {
        if (currentParty) {
            setPartyId(currentParty.id);
        }
    }, [currentParty]);

    return (
        <PartyCollapse storageKey={`${ID}.party.money.collapsed`} heading="Money">
            <PartyMoneyContent party={party} />
        </PartyCollapse>
    );
};
