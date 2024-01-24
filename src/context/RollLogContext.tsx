import { create, StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";

export type RollLogEntry = {};

export type RollLogContextType = {
    log: Array<RollLogEntry>;
    add: (roll: RollLogEntry) => void;
};

const rollLogSlice: StateCreator<RollLogContextType, [["zustand/persist", unknown]]> = (set) => ({
    log: [],
    add: (roll) =>
        set((state) => {
            state.log.push(roll);
            return { ...state };
        }),
});
export const useRollLogContext = create<RollLogContextType>()(
    persist(rollLogSlice, {
        name: `${ID}.roll-log`,
    })
);
