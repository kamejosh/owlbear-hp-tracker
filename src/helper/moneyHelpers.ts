import { MoneyIn } from "../api/tabletop-almanac/useParty.ts";
import { Money } from "../components/party/PlayerParty.tsx";
import { evalString } from "./helpers.ts";

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
