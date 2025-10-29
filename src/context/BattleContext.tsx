import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";

export type BattleContextType = {
    groups: Array<string>;
    current: string | null;
    next: string | null;
    battle: boolean;
    battleRound: number;
};

export type BattleContextActions = {
    addGroup: (group: string) => void;
    removeGroup: (group: string) => void;
    setGroups: (groups: string[]) => void;
    setCurrent: (id: string | null) => void;
    setNext: (id: string | null) => void;
    setBattle: (battle: boolean) => void;
    setBattleRound: (battleRound: number) => void;
};

export const useBattleContext = create<BattleContextType & BattleContextActions>()(
    persist<BattleContextType & BattleContextActions>(
        (set) => ({
            groups: [] as Array<string>,
            current: null,
            next: null,
            battle: false,
            battleRound: 1,
            setCurrent: (id) =>
                set(() => {
                    return { current: id };
                }),
            setNext: (id) =>
                set(() => {
                    return { next: id };
                }),
            addGroup: (group) =>
                set((state) => {
                    const groups = Array.from(state.groups);
                    if (!groups.includes(group)) {
                        groups.push(group);
                    }
                    return { groups: groups };
                }),
            removeGroup: (group) =>
                set((state) => {
                    const groups = Array.from(state.groups);
                    const index = groups.findIndex((g) => g === group);
                    if (index >= 0) {
                        groups.splice(index, 1);
                    }
                    return { groups: groups };
                }),
            setGroups: (groups) =>
                set(() => {
                    return { groups: groups };
                }),
            setBattle: (battle) =>
                set(() => {
                    return { battle: battle };
                }),
            setBattleRound: (battleRound) =>
                set(() => {
                    return { battleRound: battleRound };
                }),
        }),
        { name: `${ID}.battle-context`, storage: createJSONStorage(() => localStorage) },
    ),
);
