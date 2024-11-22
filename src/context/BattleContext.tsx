import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";

export type BattleContextType = {
    groups: Array<string>;
    current: string | null;
    battle: boolean;
};

export type BattleContextActions = {
    addGroup: (group: string) => void;
    removeGroup: (group: string) => void;
    setCurrent: (id: string | null) => void;
    setBattle: (battle: boolean) => void;
};

export const useBattleContext = create<BattleContextType & BattleContextActions>()(
    persist(
        (set) => ({
            groups: [],
            current: null,
            battle: false,
            setCurrent: (id) =>
                set(() => {
                    return { current: id };
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
            setBattle: (battle) =>
                set(() => {
                    return { battle: battle };
                }),
        }),
        { name: `${ID}.battle-context`, storage: createJSONStorage(() => localStorage) },
    ),
);
