import { create, StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";

export type DiceButtonsType = {
    1: string | null;
    2: string | null;
    3: string | null;
    4: string | null;
    5: string | null;
    6: string | null;
    7: string | null;
    8: string | null;
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
export const useDiceButtonsContext = create<DiceButtonsContextType>()(
    persist(dicebuttonsSlice, {
        name: `${ID}.dice-buttons`,
    })
);
