import { useLootTokenContext } from "../../context/LootTokenContext.tsx";
import { useEffect, useState, useMemo } from "react";
import { useDebounceFn } from "ahooks";
import { useForm } from "react-hook-form";
import {
    MoneyIn,
    useGetParty,
    useUpdatePartyMoney,
    useUpdatePartyStatblockMoney,
} from "../../api/tabletop-almanac/useParty.ts";
import { useE5GetStatblock } from "../../api/e5/useE5Api.ts";
import { updateLootMetadata } from "../../helper/tokenHelper.ts";
import { EditGroup } from "../form/EditButton.tsx";
import { SubmitButton } from "../form/SubmitButton.tsx";
import { CancelButton } from "../form/CancelButton.tsx";
import styles from "../party/party-inventory.module.scss";
import lootStyles from "./loot.module.scss";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { CurrencyExchangeRounded } from "@mui/icons-material";
import { Money } from "../party/PlayerParty.tsx";
import { currencies, formatCP, normalizeToCP, resolveCalculation, toCP } from "../../helper/moneyHelpers.ts";
import Tippy from "@tippyjs/react";

export const LootMoneyTransfer = ({ setIsTransferring }: { setIsTransferring: (value: boolean) => void }) => {
    const apiKey = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);
    const partyId = useMetadataContext((state) => state.room?.partyId);
    const data = useLootTokenContext((state) => state.data);
    const token = useLootTokenContext((state) => state.token);
    const [recipient, setRecipient] = useState<string>("party");
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const { run: hideError } = useDebounceFn(() => setError(null), { wait: 3000 });
    const { data: party } = useGetParty(partyId);

    const transferForm = useForm<MoneyIn>({
        defaultValues: {
            pp: data?.money?.pp || 0,
            gp: data?.money?.gp || 0,
            ep: data?.money?.ep || 0,
            sp: data?.money?.sp || 0,
            cp: data?.money?.cp || 0,
        },
    });

    const updatePartyMoney = useUpdatePartyMoney(partyId ?? -1, party?.money?.id);

    const selectedStatblock = useMemo(() => {
        if (recipient === "party") return null;
        return party?.statblocks?.find((s) => s.id === Number(recipient));
    }, [party, recipient]);

    const { data: fullStatblock } = useE5GetStatblock(selectedStatblock?.statblock?.slug ?? "", apiKey);

    const updateMemberMoney = useUpdatePartyStatblockMoney(
        partyId ?? -1,
        selectedStatblock?.id ?? -1,
        selectedStatblock?.statblock?.slug ?? "",
    );

    if (!token || !data) {
        return null;
    }

    const onTransfer = async (formData: MoneyIn) => {
        if (!partyId || !party) {
            setError("No party selected in room settings");
            hideError();
            return;
        }

        setPending(true);

        const transferValues: Money = {
            pp: Number(formData.pp) || 0,
            gp: Number(formData.gp) || 0,
            ep: Number(formData.ep) || 0,
            sp: Number(formData.sp) || 0,
            cp: Number(formData.cp) || 0,
        };

        const transferCP = toCP(transferValues);
        const availableCP = toCP(data.money);

        if (transferCP <= 0) {
            setError("Transfer amount must be greater than 0");
            hideError();
            setPending(false);
            return;
        }

        if (transferCP > availableCP) {
            setError("Cannot transfer more than available in loot");
            hideError();
            setPending(false);
            return;
        }

        try {
            if (recipient === "party") {
                const currentPartyMoney = party.money || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
                const newPartyMoney: MoneyIn = {
                    pp: (currentPartyMoney.pp || 0) + transferValues.pp,
                    gp: (currentPartyMoney.gp || 0) + transferValues.gp,
                    ep: (currentPartyMoney.ep || 0) + transferValues.ep,
                    sp: (currentPartyMoney.sp || 0) + transferValues.sp,
                    cp: (currentPartyMoney.cp || 0) + transferValues.cp,
                };
                await updatePartyMoney.mutateAsync(newPartyMoney);
            } else if (selectedStatblock) {
                if (!fullStatblock) {
                    setError("Recipient details not loaded yet");
                    hideError();
                    setPending(false);
                    return;
                }
                const currentMemberMoney = fullStatblock.money || { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 };
                const newMemberMoney: MoneyIn = {
                    pp: (currentMemberMoney.pp || 0) + transferValues.pp,
                    gp: (currentMemberMoney.gp || 0) + transferValues.gp,
                    ep: (currentMemberMoney.ep || 0) + transferValues.ep,
                    sp: (currentMemberMoney.sp || 0) + transferValues.sp,
                    cp: (currentMemberMoney.cp || 0) + transferValues.cp,
                };
                await updateMemberMoney.mutateAsync(newMemberMoney);
            }

            const remainingMoney: MoneyIn = {
                pp: (data.money.pp || 0) - transferValues.pp,
                gp: (data.money.gp || 0) - transferValues.gp,
                ep: (data.money.ep || 0) - transferValues.ep,
                sp: (data.money.sp || 0) - transferValues.sp,
                cp: (data.money.cp || 0) - transferValues.cp,
            };

            const normalizedRemaining = normalizeToCP(remainingMoney);
            await updateLootMetadata({ ...data, money: normalizedRemaining }, [token.id]);
            setIsTransferring(false);
        } catch (e: any) {
            setError(`Transfer failed: ${e?.response?.data?.detail ?? e?.message ?? "Unknown error"}`);
            hideError();
        }
        setPending(false);
    };

    return (
        <div className={lootStyles.transferContainer}>
            {error && <div className={lootStyles.errorContainer}>{error}</div>}
            <div className={lootStyles.transferTitle}>Transfer Money to Recipient</div>

            <div className={lootStyles.transferRecipient}>
                <FormControl fullWidth size="small">
                    <InputLabel className={lootStyles.filterLabel}>Recipient</InputLabel>
                    <Select
                        value={recipient}
                        label="Recipient"
                        onChange={(e) => setRecipient(e.target.value)}
                        className={lootStyles.filterSelect}
                    >
                        <MenuItem value="party">Party Inventory</MenuItem>
                        {party?.statblocks?.map((sb) => (
                            <MenuItem key={sb.id} value={String(sb.id)}>
                                {sb.statblock?.name || "Unknown Member"}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>

            <div className={lootStyles.transferAmount}>
                {currencies.map((currency) => (
                    <div key={currency.key} className={lootStyles.moneyItem}>
                        <input
                            type="number"
                            min={0}
                            {...transferForm.register(currency.key, { valueAsNumber: true })}
                            className={`${styles.costItem} ${styles[currency.key]} ${lootStyles.moneyInput}`}
                        />
                        <span className={`${styles.costItem} ${styles[currency.key]} ${lootStyles.moneyLabel}`}>
                            {currency.label}
                        </span>
                    </div>
                ))}
            </div>

            <div className={lootStyles.transferActions}>
                <button
                    className="button"
                    disabled={pending}
                    onClick={transferForm.handleSubmit(onTransfer)}
                    style={{ display: "flex", alignItems: "center", gap: "0.5ch" }}
                >
                    <CurrencyExchangeRounded fontSize="small" />
                    Transfer
                </button>
                <CancelButton onClick={() => setIsTransferring(false)} />
            </div>
        </div>
    );
};

export const LootMoney = () => {
    const data = useLootTokenContext((state) => state.data);
    const token = useLootTokenContext((state) => state.token);
    const [isEditing, setIsEditing] = useState(false);
    const [isTransferring, setIsTransferring] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const partyId = useMetadataContext((state) => state.room?.partyId);
    const tabletopAlmanacAPIKey = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);

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

    if (isTransferring) {
        return <LootMoneyTransfer setIsTransferring={setIsTransferring} />;
    }

    return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
            {error && <div className={lootStyles.errorContainer}>{error}</div>}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    alignItems: "center",
                }}
            >
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
                                        className={`${styles.costItem} ${styles[currency.key]} ${
                                            lootStyles.moneyInput
                                        }`}
                                    />
                                ) : (
                                    <span
                                        className={`${styles.costItem} ${styles[currency.key]} ${
                                            lootStyles.moneyValue
                                        }`}
                                    >
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
                {!isEditing ? (
                    <Tippy
                        content={`${!partyId || !tabletopAlmanacAPIKey ? "A Party is required to transfer money directly" : "Transfer money"}`}
                    >
                        <div>
                            <button
                                type="button"
                                className="button"
                                disabled={!partyId || !tabletopAlmanacAPIKey}
                                onClick={() => setIsTransferring(true)}
                                style={{
                                    fontSize: "0.8rem",
                                    padding: "2px 8px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "0.5ch",
                                }}
                            >
                                <CurrencyExchangeRounded style={{ fontSize: "1rem" }} />
                                Loot Money
                            </button>
                        </div>
                    </Tippy>
                ) : null}
            </div>
        </form>
    );
};
