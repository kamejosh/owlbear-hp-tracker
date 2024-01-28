import { ThreeDDice } from "dddice-js";
import { create } from "zustand";

export type DiceRoller = {
    roller: ThreeDDice;
    initialized: boolean;
    setInitialized: (initialized: boolean) => void;
};

export const useDiceRoller = create<DiceRoller>()((set) => ({
    roller: new ThreeDDice(),
    initialized: false,
    setInitialized: (initialized: boolean) => set(() => ({ initialized: initialized })),
}));
