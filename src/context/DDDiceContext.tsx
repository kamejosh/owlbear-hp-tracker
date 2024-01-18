import { ThreeDDice } from "dddice-js";
import { create } from "zustand";

export type DiceRoller = {
    roller: ThreeDDice;
};

export const useDiceRoller = create<DiceRoller>()(() => ({
    roller: new ThreeDDice(),
}));
