import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";

export type ActiveTabContextType = {
    activeTab: Record<string, string>;
    setActiveTab: (statblock: string, tab: string) => void;
};

export const useActiveTabContext = create<ActiveTabContextType>()(
    persist(
        (set) => ({
            activeTab: {},
            setActiveTab: (statblock: string, tab: string) =>
                set((state) => {
                    const currentActiveTabs = state.activeTab;
                    if (state.activeTab[statblock] !== tab) {
                        currentActiveTabs[statblock] = tab;
                        return { activeTab: currentActiveTabs };
                    } else {
                        return state;
                    }
                }),
        }),
        {
            name: `${ID}.activeTab`,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
