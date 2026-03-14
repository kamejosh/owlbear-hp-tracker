import { usePartyStore } from "../../context/PartyStore.tsx";
import { useEffect, useState } from "react";
import { MoneyIn, PartyOut, useGetParty, useUpdatePartyMoney } from "../../api/tabletop-almanac/useParty.ts";
import { useLocalStorageState } from "ahooks";
import { ID } from "../../helper/variables.ts";
import { ChevronRight } from "@mui/icons-material";
import { EditGroup } from "../form/EditButton.tsx";
import { SubmitButton } from "../form/SubmitButton.tsx";
import { Loader } from "../general/Loader.tsx";
import { useForm } from "react-hook-form";
import styles from "./party-inventory.module.scss";
import { evalString } from "../../helper/helpers.ts";

const RATES = {
    pp: 1000,
    gp: 100,
    ep: 50,
    sp: 10,
    cp: 1,
};

const normalizeToCP = (money: MoneyIn): MoneyIn => {
    let pp = Number(money.pp) || 0;
    let gp = Number(money.gp) || 0;
    let ep = Number(money.ep) || 0;
    let sp = Number(money.sp) || 0;
    let cp = Number(money.cp) || 0;

    // Step 1: Resolve negatives from left to right (borrow from higher)
    // 10CP = 1SP
    if (cp < 0) {
        const needed = Math.ceil(Math.abs(cp) / 10);
        sp -= needed;
        cp += needed * 10;
    }
    // 5SP = 1EP
    if (sp < 0) {
        const needed = Math.ceil(Math.abs(sp) / 5);
        ep -= needed;
        sp += needed * 5;
    }
    // 2EP = 1GP
    if (ep < 0) {
        const needed = Math.ceil(Math.abs(ep) / 2);
        gp -= needed;
        ep += needed * 2;
    }
    // 10GP = 1PP
    if (gp < 0) {
        const needed = Math.ceil(Math.abs(gp) / 10);
        pp -= needed;
        gp += needed * 10;
    }

    // Step 2: Resolve negatives from right to left (borrow from lower)
    // If PP is negative, we MUST borrow from GP. 1PP = 10GP
    if (pp < 0) {
        const needed = Math.abs(pp) * 10;
        gp -= needed;
        pp = 0;
    }
    // If GP is negative, borrow from EP. 1GP = 2EP
    if (gp < 0) {
        const needed = Math.abs(gp) * 2;
        ep -= needed;
        gp = 0;
    }
    // If EP is negative, borrow from SP. 1EP = 5SP
    if (ep < 0) {
        const needed = Math.abs(ep) * 5;
        sp -= needed;
        ep = 0;
    }
    // If SP is negative, borrow from CP. 1SP = 10CP
    if (sp < 0) {
        const needed = Math.abs(sp) * 10;
        cp -= needed;
        sp = 0;
    }

    // Since we check totalCP >= 0 before calling this, we should be at 0 or higher for all now.
    // However, Step 2 might have introduced new negatives to the right.
    // We should repeat the Step 1 process once more to ensure everything is resolved.
    if (cp < 0 || sp < 0 || ep < 0 || gp < 0) {
        return normalizeToCP({ pp, gp, ep, sp, cp });
    }

    return { pp, gp, ep, sp, cp };
};

const toCP = (money: MoneyIn): number => {
    return (
        (Number(money.pp) || 0) * RATES.pp +
        (Number(money.gp) || 0) * RATES.gp +
        (Number(money.ep) || 0) * RATES.ep +
        (Number(money.sp) || 0) * RATES.sp +
        (Number(money.cp) || 0) * RATES.cp
    );
};

const formatCP = (totalCP: number): string => {
    let remaining = Math.abs(totalCP);
    const parts: string[] = [];

    if (remaining >= RATES.pp) {
        const amount = Math.floor(remaining / RATES.pp);
        parts.push(`${amount}pp`);
        remaining %= RATES.pp;
    }
    if (remaining >= RATES.gp) {
        const amount = Math.floor(remaining / RATES.gp);
        parts.push(`${amount}gp`);
        remaining %= RATES.gp;
    }
    if (remaining >= RATES.ep) {
        const amount = Math.floor(remaining / RATES.ep);
        parts.push(`${amount}ep`);
        remaining %= RATES.ep;
    }
    if (remaining >= RATES.sp) {
        const amount = Math.floor(remaining / RATES.sp);
        parts.push(`${amount}sp`);
        remaining %= RATES.sp;
    }
    if (remaining > 0) {
        parts.push(`${remaining}cp`);
    }

    return parts.join(" ");
};

const resolveCalculation = (input: string, currentValue: number): number => {
    let value: number;
    if (input.startsWith("+") || input.startsWith("-")) {
        const result = evalString(input);
        value = Number(currentValue) + result;
    } else if (input.includes("+") || input.includes("-")) {
        value = evalString(input);
    } else {
        const parsed = parseFloat(input);
        value = isNaN(parsed) ? currentValue : parsed;
    }
    return value;
};

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

    const [collapsed, setCollapsed] = useLocalStorageState<boolean>(`${ID}.party.money.collapsed`, {
        defaultValue: false,
    });

    useEffect(() => {
        if (currentParty) {
            setPartyId(currentParty.id);
        }
    }, [currentParty]);

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    gap: "1ch",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <h3>Money</h3>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ display: "flex", gap: "1ch", alignItems: "center" }}
                >
                    <ChevronRight sx={{ rotate: collapsed ? "0deg" : "90deg", transition: "all 0.25s ease" }} />
                </button>
            </div>
            {collapsed ? null : <PartyMoneyContent party={party} />}
        </div>
    );
};
