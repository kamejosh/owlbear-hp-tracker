import { create } from "zustand";
import { Ruleset } from "../ttrpgapi/useTtrpgApi.ts";

export type Filter = {
    ruleset: Ruleset;
    setRuleset: (ruleset: Ruleset) => void;
};

export const useFilter = create<Filter>()((set) => ({
    ruleset: "5e",
    setRuleset: (ruleset) => set(() => ({ ruleset: ruleset })),
}));
