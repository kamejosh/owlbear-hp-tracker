import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";

export type PinnedAbilitiesStore = {
    pinnedAbilities: Array<string>;
    pinAbility: (ability: string) => void;
    unPinAbility: (ability: string) => void;
};

export const usePinnedAbilitiesStore = create<PinnedAbilitiesStore>()(
    persist<PinnedAbilitiesStore>(
        (set) => ({
            pinnedAbilities: [],
            pinAbility: (ability: string) =>
                set((state) => {
                    if (state.pinnedAbilities.includes(ability)) {
                        return state;
                    } else {
                        const newAbilities = state.pinnedAbilities.concat([ability]);
                        return { pinnedAbilities: newAbilities };
                    }
                }),
            unPinAbility: (ability: string) =>
                set((state) => {
                    const index = state.pinnedAbilities.indexOf(ability);
                    if (index >= 0) {
                        const newAbilities = [...state.pinnedAbilities];
                        newAbilities.splice(index, 1);
                        return { pinnedAbilities: newAbilities };
                    }
                    return state;
                }),
        }),
        {
            name: `${ID}.pinned-abilities`,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
