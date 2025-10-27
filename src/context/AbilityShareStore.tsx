import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";
import { withStorageDOMEvents } from "../helper/hooks.ts";
import { createStore } from "zustand/vanilla";
import { components } from "../api/schema";
import { Action, Reaction, SpecialAbility } from "../components/gmgrimoire/statblocks/pf/PfAbility.tsx";
import { PfSpellOut } from "../components/gmgrimoire/statblocks/pf/PfSpells.tsx";
import { Stats } from "../components/general/DiceRoller/DiceButtonWrapper.tsx";

export type E5Ability = components["schemas"]["Action-Output"];
export type E5Spell = components["schemas"]["src__model_types__e5__spell__Spell"];

export type AbilityShareEntry = {
    id: string;
    timestamp?: number;
    username: string;
    statblockName: string;
    visibleFor?: Array<string>;
    name: string;
    itemId: string;
    statblockStats?: Stats;
    proficient?: boolean;
    spellDc?: string | null;
    spellAttack?: string | null;
    e5Action?: E5Ability;
    e5Spell?: E5Spell;
    pfAction?: Action | Reaction | SpecialAbility;
    pfSpell?: PfSpellOut;
};

export type AbilityShareStoreType = {
    abilities: Array<AbilityShareEntry>;
    addAbility: (ability: AbilityShareEntry) => void;
    removeAbility: (id: string) => void;
    clear: () => void;
    lastReadCount: number;
    setLastReadCount: (lastRead: number) => void;
};

export const abilityShareStore = createStore<AbilityShareStoreType>()(
    persist<AbilityShareStoreType>(
        (set) => ({
            abilities: [],
            addAbility: (ability) =>
                set((state) => {
                    if (!state.abilities.find((s) => s.id === ability.id)) {
                        if (state.abilities.length > 100) {
                            state.abilities.splice(100, state.abilities.length - 100);
                        }
                        state.abilities.push(ability);
                        window.dispatchEvent(
                            new StorageEvent("storage", { newValue: "new roll", key: `${ID}.roll-log` }),
                        );
                    } else {
                    }
                    return { ...state };
                }),
            removeAbility: (id) => set((state) => ({ abilities: state.abilities.filter((s) => s.id !== id) })),
            clear: () => {
                set(() => {
                    window.dispatchEvent(
                        new StorageEvent("storage", { newValue: "clear", key: `${ID}.ability-share` }),
                    );
                    return { abilities: [] };
                });
            },
            lastReadCount: 0,
            setLastReadCount: (lastReadCount) =>
                set((state) => {
                    if (state.lastReadCount < lastReadCount) {
                        state.lastReadCount = lastReadCount;
                    }
                    return { lastReadCount: lastReadCount };
                }),
        }),
        {
            name: `${ID}.ability-share`,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

export function useAbilityShareStore(): AbilityShareStoreType;
export function useAbilityShareStore<T>(selector: (state: AbilityShareStoreType) => T): T;
export function useAbilityShareStore<T>(selector?: (state: AbilityShareStoreType) => T) {
    return useStore(abilityShareStore, selector!);
}

withStorageDOMEvents(abilityShareStore);
