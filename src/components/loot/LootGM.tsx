import { useLootTokenContext } from "../../context/LootTokenContext.tsx";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { MoneyIn } from "../../api/tabletop-almanac/useParty.ts";
import { evalString } from "../../helper/helpers.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { updateLootMetadata } from "../../helper/tokenHelper.ts";
import { EditGroup } from "../form/EditButton.tsx";
import { SubmitButton } from "../form/SubmitButton.tsx";
import { CancelButton } from "../form/CancelButton.tsx";
import styles from "../party/party-inventory.module.scss";
import lootStyles from "./loot.module.scss";
import { defaultLoot } from "../../helper/variables.ts";
import Tippy from "@tippyjs/react";

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

    if (pp < 0) {
        const needed = Math.abs(pp) * 10;
        gp -= needed;
        pp = 0;
    }
    if (gp < 0) {
        const needed = Math.abs(gp) * 2;
        ep -= needed;
        gp = 0;
    }
    if (ep < 0) {
        const needed = Math.abs(ep) * 5;
        sp -= needed;
        ep = 0;
    }
    if (sp < 0) {
        const needed = Math.abs(sp) * 10;
        cp -= needed;
        sp = 0;
    }

    if (cp < 0) {
        const needed = Math.ceil(Math.abs(cp) / 10);
        sp -= needed;
        cp += needed * 10;
    }
    if (sp < 0) {
        const needed = Math.ceil(Math.abs(sp) / 5);
        ep -= needed;
        sp += needed * 5;
    }
    if (ep < 0) {
        const needed = Math.ceil(Math.abs(ep) / 2);
        gp -= needed;
        ep += needed * 2;
    }
    if (gp < 0) {
        const needed = Math.ceil(Math.abs(gp) / 10);
        pp -= needed;
        gp += needed * 10;
    }

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
        value = Number(currentValue) + Number(result);
    } else if (input.includes("+") || input.includes("-")) {
        value = Number(evalString(input));
    } else {
        const parsed = parseFloat(input);
        value = isNaN(parsed) ? currentValue : parsed;
    }
    return value;
};

export const LootGM = () => {
    const data = useLootTokenContext((state) => state.data);
    const token = useLootTokenContext((state) => state.token);

    if (!token) {
        return <div>No token selected for loot</div>;
    }

    if (!data) {
        return (
            <>
                <div className={lootStyles.header}>
                    <div>
                        {token.type === "IMAGE" ? (
                            <img src={(token as Image).image.url} alt={token.name} className={lootStyles.tokenImage} />
                        ) : null}
                    </div>
                    <h2 className={lootStyles.tokenName}>{token.name}</h2>
                </div>
                Initialize Loot for Token:{" "}
                <button
                    onClick={() => {
                        void updateLootMetadata(defaultLoot, [token.id]);
                    }}
                >
                    Initialize
                </button>
            </>
        );
    }

    return (
        <>
            <div className={lootStyles.header}>
                <div>
                    {token.type === "IMAGE" ? (
                        <img src={(token as Image).image.url} alt={token.name} className={lootStyles.tokenImage} />
                    ) : null}
                </div>
                <h2 className={lootStyles.tokenName}>{token.name}</h2>
                <Tippy
                    content={data.lootAvailable ? "Looting is enabled for players" : "Looting is disabled for players"}
                >
                    <button
                        className={`button ${lootStyles.statusButton} ${
                            data.lootAvailable ? lootStyles.lootable : lootStyles.locked
                        }`}
                        onClick={() => {
                            void updateLootMetadata({ ...data, lootAvailable: !data.lootAvailable }, [token.id]);
                        }}
                    >
                        <span
                            className={`${lootStyles.statusDot} ${
                                data.lootAvailable ? lootStyles.lootable : lootStyles.locked
                            }`}
                        />
                        {data.lootAvailable ? "Lootable" : "Locked"}
                    </button>
                </Tippy>
            </div>
            <div className={lootStyles.section}>
                <h2 className={lootStyles.sectionTitle}>Money</h2>
                <LootMoney />
            </div>
            <div className={lootStyles.section + " " + lootStyles.last}>
                <h2 className={lootStyles.sectionTitle}>Items</h2>
                {data?.items.length > 0 ? (
                    data.items.map((item) => {
                        return (
                            <div key={item.id} className={lootStyles.itemRow}>
                                <span className={lootStyles.itemName}>{item.name}</span>
                                <span className={lootStyles.itemCount}>x{item.count}</span>
                            </div>
                        );
                    })
                ) : (
                    <div className={lootStyles.noItems}>No items in loot</div>
                )}
            </div>
        </>
    );
};

const LootMoney = () => {
    const data = useLootTokenContext((state) => state.data);
    const token = useLootTokenContext((state) => state.token);
    const [isEditing, setIsEditing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const form = useForm<MoneyIn>({
        defaultValues: {
            pp: data?.money?.pp || 0,
            gp: data?.money?.gp || 0,
            ep: data?.money?.ep || 0,
            sp: data?.money?.sp || 0,
            cp: data?.money?.cp || 0,
        },
    });

    useEffect(() => {
        if (!isEditing && data?.money) {
            form.reset({
                pp: data.money.pp || 0,
                gp: data.money.gp || 0,
                ep: data.money.ep || 0,
                sp: data.money.sp || 0,
                cp: data.money.cp || 0,
            });
        }
    }, [data?.money, isEditing, form]);

    if (!token || !data) {
        return null;
    }

    const onSubmit = async (formData: MoneyIn) => {
        setPending(true);
        const resolvedValues: MoneyIn = {
            pp: resolveCalculation(String(formData.pp), data.money.pp || 0),
            gp: resolveCalculation(String(formData.gp), data.money.gp || 0),
            ep: resolveCalculation(String(formData.ep), data.money.ep || 0),
            sp: resolveCalculation(String(formData.sp), data.money.sp || 0),
            cp: resolveCalculation(String(formData.cp), data.money.cp || 0),
        };

        const totalCP = toCP(resolvedValues);

        if (totalCP < 0) {
            const deficit = formatCP(totalCP);
            setError(`Not enough money present (Missing ${deficit})`);
            setTimeout(() => setError(null), 3000);
            setPending(false);
            return;
        }

        const normalized = normalizeToCP(resolvedValues);
        const newMoney = {
            pp: Number(normalized.pp),
            gp: Number(normalized.gp),
            ep: Number(normalized.ep),
            sp: Number(normalized.sp),
            cp: Number(normalized.cp),
        };

        await updateLootMetadata({ ...data, money: newMoney }, [token.id]);
        setIsEditing(false);
        setPending(false);
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
            form.setValue(key, (data.money[key] || 0) as any);
            return;
        }

        const currentValue = data.money[key] || 0;
        const resolved = resolveCalculation(input, currentValue);

        const currentFormValues = form.getValues();
        const draftMoney = { ...currentFormValues, [key]: resolved };

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

    const getDiff = () => {
        if (!data?.money) return [];
        const diffs: Array<{ value: number; label: string; sign: string }> = [];
        const currentValues = form.getValues();
        currencies.forEach((currency) => {
            const current = Number(currentValues[currency.key]) || 0;
            const original = data.money[currency.key] || 0;
            const diff = current - original;
            if (diff !== 0) {
                diffs.push({
                    value: Math.abs(diff),
                    label: currency.label.toUpperCase(),
                    sign: diff > 0 ? "+" : "-",
                });
            }
        });
        return diffs;
    };

    const diffs = getDiff();

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            {error && <div className={lootStyles.errorContainer}>{error}</div>}
            <EditGroup heading={null} alignLeft={false} alignCenter={true} onClick={() => setIsEditing(!isEditing)}>
                <div className={lootStyles.moneyContainer}>
                    {currencies.map((currency) => (
                        <div key={currency.key} className={lootStyles.moneyItem}>
                            {isEditing ? (
                                <input
                                    type="text"
                                    {...form.register(currency.key)}
                                    onBlur={() => onBlur(currency.key)}
                                    onKeyDown={(e) => onKeyDown(e, currency.key)}
                                    className={`${styles.costItem} ${styles[currency.key]} ${lootStyles.moneyInput}`}
                                />
                            ) : (
                                <span className={`${styles.costItem} ${styles[currency.key]} ${lootStyles.moneyValue}`}>
                                    {form.getValues(currency.key) || 0}
                                </span>
                            )}
                            <span className={`${styles.costItem} ${styles[currency.key]} ${lootStyles.moneyLabel}`}>
                                {currency.label}
                            </span>
                        </div>
                    ))}
                    {isEditing && (
                        <div className={lootStyles.editActions}>
                            {diffs.length > 0 && (
                                <div className={lootStyles.diffContainer}>
                                    {diffs.map((diff, i) => (
                                        <span
                                            key={i}
                                            className={`${lootStyles.diffItem} ${
                                                diff.sign === "+" ? lootStyles.positive : lootStyles.negative
                                            }`}
                                        >
                                            {diff.sign}
                                            {diff.value}
                                            {diff.label}
                                        </span>
                                    ))}
                                </div>
                            )}
                            <SubmitButton form={form} pending={pending} />
                            <CancelButton onClick={() => setIsEditing(false)} />
                        </div>
                    )}
                </div>
            </EditGroup>
        </form>
    );
};
