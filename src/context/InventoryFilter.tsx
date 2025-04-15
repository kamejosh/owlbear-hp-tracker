import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";

export type InventoryFilterType = {
    filter: {
        consumable: boolean;
        isEquipped: boolean;
        isAttuned: boolean;
        search: string;
    };
    sort: "name" | "cost" | "equipped" | "attuned";
};

export type InventoryFilterContext = {
    filter: InventoryFilterType;
    setFilter: (filters: InventoryFilterType) => void;
};

export const useInventoryFilterContext = create<InventoryFilterContext>()(
    persist(
        (set) => ({
            filter: {
                filter: {
                    consumable: false,
                    isEquipped: false,
                    isAttuned: false,
                    search: "",
                },
                sort: "name",
            },
            setFilter: (filter: InventoryFilterType) =>
                set(() => {
                    return { filter: filter };
                }),
        }),
        {
            name: `${ID}.inventory-filter`,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
