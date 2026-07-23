import { MoneyIn } from "../api/tabletop-almanac/useParty.ts";
import { evalString } from "./helpers.ts";
import { Money } from "./types.ts";

export const RATES = {
    pp: 1000,
    gp: 100,
    ep: 50,
    sp: 10,
    cp: 1,
};

export const normalizeToCP = (money: MoneyIn): Money => {
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

export const toCP = (money: MoneyIn): number => {
    return (
        (Number(money.pp) || 0) * RATES.pp +
        (Number(money.gp) || 0) * RATES.gp +
        (Number(money.ep) || 0) * RATES.ep +
        (Number(money.sp) || 0) * RATES.sp +
        (Number(money.cp) || 0) * RATES.cp
    );
};

export const formatCP = (totalCP: number): string => {
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

export const resolveCalculation = (input: string, currentValue: number): number => {
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

export const setNullToZero = (money: MoneyIn): Money => {
    return {
        cp: money.cp ?? 0,
        sp: money.sp ?? 0,
        ep: money.ep ?? 0,
        gp: money.gp ?? 0,
        pp: money.pp ?? 0,
    };
};

export const addMoney = (a: MoneyIn, b: MoneyIn): Money => {
    return {
        pp: (Number(a.pp) || 0) + (Number(b.pp) || 0),
        gp: (Number(a.gp) || 0) + (Number(b.gp) || 0),
        ep: (Number(a.ep) || 0) + (Number(b.ep) || 0),
        sp: (Number(a.sp) || 0) + (Number(b.sp) || 0),
        cp: (Number(a.cp) || 0) + (Number(b.cp) || 0),
    };
};

export const scaleMoney = (money: MoneyIn, factor: number): Money => {
    return {
        pp: Math.round((Number(money.pp) || 0) * factor),
        gp: Math.round((Number(money.gp) || 0) * factor),
        ep: Math.round((Number(money.ep) || 0) * factor),
        sp: Math.round((Number(money.sp) || 0) * factor),
        cp: Math.round((Number(money.cp) || 0) * factor),
    };
};

export const subtractMoney = (a: MoneyIn, b: MoneyIn): Money => addMoney(a, scaleMoney(b, -1));

// Shopkeepers offer between 80% and 95% of an item's catalog value when buying from players.
export const randomSellPercent = (): number => 0.8 + Math.random() * 0.15;

export const getRandomSellOffer = (catalogCost: MoneyIn): Money => scaleMoney(catalogCost, randomSellPercent());

export const currencies: Array<{ key: keyof MoneyIn; label: string }> = [
    { key: "pp", label: "pp" },
    { key: "gp", label: "gp" },
    { key: "ep", label: "ep" },
    { key: "sp", label: "sp" },
    { key: "cp", label: "cp" },
];
