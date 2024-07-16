import { StateCreator, useStore } from "zustand";
import { persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";
import { withStorageDOMEvents } from "../helper/hooks.ts";
import { createStore } from "zustand/vanilla";

export type CustomDieNotation = {
    dice: string;
    theme?: string;
};

export type DiceButtonsType = {
    1: CustomDieNotation | null;
    2: CustomDieNotation | null;
    3: CustomDieNotation | null;
    4: CustomDieNotation | null;
    5: CustomDieNotation | null;
    6: CustomDieNotation | null;
    7: CustomDieNotation | null;
    8: CustomDieNotation | null;
};

export type DiceButtonsContextType = {
    buttons: DiceButtonsType;
    setButtons: (button: Partial<DiceButtonsType>) => void;
};

const dicebuttonsSlice: StateCreator<DiceButtonsContextType, [["zustand/persist", unknown]]> = (set) => ({
    buttons: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null },
    setButtons: (button) =>
        set((state) => {
            return { buttons: { ...state.buttons, ...button } };
        }),
});
export const diceButtonsStore = createStore<DiceButtonsContextType>()(
    persist(dicebuttonsSlice, {
        name: `${ID}.dice-buttons`,
    })
);

export function useDiceButtonsContext(): DiceButtonsContextType;
export function useDiceButtonsContext<T>(selector: (state: DiceButtonsContextType) => T): T;
export function useDiceButtonsContext<T>(selector?: (state: DiceButtonsContextType) => T) {
    return useStore(diceButtonsStore, selector!);
}

withStorageDOMEvents(diceButtonsStore);
