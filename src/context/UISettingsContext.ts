import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";
import { ID } from "../helper/variables.ts";

export type UISettingsContextType = {
    playerPreview: boolean;
    setPlayerPreview: (playerPreview: boolean) => void;
};

export const useUISettingsContext = create<UISettingsContextType>()(
    persist(
        (set) => ({
            playerPreview: true,
            setPlayerPreview: (playerPreview) =>
                set(() => {
                    return { playerPreview: playerPreview };
                }),
        }),
        {
            name: `${ID}.ui-settings`,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
