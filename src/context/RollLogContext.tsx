import { create, StateCreator } from "zustand";
import { persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";
import { IRollValue, IRollValueImage } from "dddice-js";

export type RollLogEntryType = {
    uuid: string;
    created_at: string;
    equation: string;
    label?: string;
    total_value: string | Array<string | IRollValueImage>;
    username: string;
    values: Array<IRollValue>;
};

export type RollLogContextType = {
    log: Array<RollLogEntryType>;
    addRoll: (roll: RollLogEntryType) => void;
    clear: () => void;
};

const rollLogSlice: StateCreator<RollLogContextType, [["zustand/persist", unknown]]> = (set) => ({
    log: [],
    addRoll: (roll) =>
        set((state) => {
            state.log.push(roll);
            return { ...state };
        }),
    clear: () => {
        set(() => {
            return { log: [] };
        });
    },
});
export const useRollLogContext = create<RollLogContextType>()(
    persist(rollLogSlice, {
        name: `${ID}.roll-log`,
    })
);
