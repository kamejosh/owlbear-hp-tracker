import { createStore } from "zustand/vanilla";
import { ITheme, ThreeDDice, ThreeDDiceAPI } from "dddice-js";
import { useStore } from "zustand";

export type DiceRoller = {
    roller: ThreeDDice;
    rollerApi: ThreeDDiceAPI | null;
    setRollerApi: (api: ThreeDDiceAPI) => void;
    initialized: boolean;
    setInitialized: (initialized: boolean) => void;
    theme: ITheme | null;
    setTheme: (theme: ITheme | null) => void;
};

export const diceRollerStore = createStore<DiceRoller>()((set) => ({
    roller: new ThreeDDice(),
    rollerApi: null,
    setRollerApi: (api) => set(() => ({ rollerApi: api })),
    initialized: false,
    setInitialized: (initialized: boolean) => set(() => ({ initialized: initialized })),
    theme: null,
    setTheme: (theme) =>
        set((state) => {
            if (state.theme?.id !== theme?.id) {
                return {
                    theme: theme,
                };
            }
            return state;
        }),
}));

export function useDiceRoller(): DiceRoller;
export function useDiceRoller<T>(selector: (state: DiceRoller) => T): T;
export function useDiceRoller<T>(selector?: (state: DiceRoller) => T) {
    return useStore(diceRollerStore, selector!);
}
