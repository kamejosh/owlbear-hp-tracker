import { UseFormReturn } from "react-hook-form";
import { Money } from "../../helper/types.ts";
import { MoneyIn } from "../../api/tabletop-almanac/useParty.ts";
import { currencies, formatCP, normalizeToCP, resolveCalculation, toCP } from "../../helper/moneyHelpers.ts";
import { Tooltip } from "@mui/material";
import styles from "./money.module.scss";

const currencyNames = {
    pp: "Platinum Pieces",
    gp: "Gold Pieces",
    ep: "Electrum Pieces",
    sp: "Silver Pieces",
    cp: "Copper Pieces",
};

interface MoneyEditInputsProps {
    form: UseFormReturn<any>;
    basePath?: string; // e.g. "money"
    originalMoney: Money | undefined;
    onError?: (error: string | null) => void;
    className?: string;
    onBlurExtra?: () => void;
}

export const MoneyEditInputs = ({
    form,
    basePath,
    originalMoney,
    onError,
    className,
    onBlurExtra,
}: MoneyEditInputsProps) => {
    const getPath = (key: string) => (basePath ? `${basePath}.${key}` : key);

    const onBlur = (key: keyof MoneyIn) => {
        const path = getPath(key);
        const input = String(form.getValues(path));

        const currentOriginal = originalMoney?.[key] || 0;

        if (!input) {
            form.setValue(path, currentOriginal as any);
            return;
        }

        const resolved = resolveCalculation(input, currentOriginal);

        const currentFormValues = basePath ? form.getValues(basePath) : form.getValues();
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
            if (onError) {
                onError(`Not enough money present (Missing ${deficit})`);
                setTimeout(() => onError(null), 3000);
            }
            form.setValue(path, currentOriginal as any);
        } else {
            const normalized = normalizeToCP(draftMoneyNumeric);
            if (basePath) {
                form.setValue(basePath, normalized);
            } else {
                form.reset(normalized);
            }
        }

        if (onBlurExtra) {
            onBlurExtra();
        }
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, key: keyof MoneyIn) => {
        if (e.key === "Enter") {
            e.preventDefault();
            onBlur(key);
        }
    };

    return (
        <div className={`${styles.moneyInputList} ${className || ""}`}>
            {currencies.map((currency) => (
                <div key={currency.key} className={styles.moneyInput}>
                    <Tooltip title={currencyNames[currency.key]} arrow placement={"top"}>
                        <label className={`${styles.costItem} ${styles[currency.key]}`}>{currency.label}</label>
                    </Tooltip>
                    <input
                        type="text"
                        {...form.register(getPath(currency.key))}
                        onBlur={() => onBlur(currency.key)}
                        onKeyDown={(e) => onKeyDown(e, currency.key)}
                    />
                </div>
            ))}
        </div>
    );
};
