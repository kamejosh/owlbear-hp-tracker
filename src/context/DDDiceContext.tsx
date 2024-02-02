import { ITheme, ThreeDDice } from "dddice-js";
import { create } from "zustand";

export type DiceRoller = {
    roller: ThreeDDice;
    initialized: boolean;
    setInitialized: (initialized: boolean) => void;
    theme: ITheme | null;
    setTheme: (theme: ITheme | null) => void;
};

export const useDiceRoller = create<DiceRoller>()((set) => ({
    roller: new ThreeDDice(),
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
