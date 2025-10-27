import { createJSONStorage, persist } from "zustand/middleware";
import { create } from "zustand";
import { ID } from "../helper/variables.ts";

export type UISettingsContextType = {
    playerPreview: boolean;
    setPlayerPreview: (playerPreview: boolean) => void;
    battleFocus: boolean;
    setBattleFocus: (battleFocus: boolean) => void;
};

export const useUISettingsContext = create<UISettingsContextType>()(
    persist(
        (set) => ({
            playerPreview: true,
            setPlayerPreview: (playerPreview) =>
                set(() => {
                    return { playerPreview: playerPreview };
                }),
            battleFocus: false,
            setBattleFocus: (battleFocus) =>
                set(() => {
                    return { battleFocus: battleFocus };
                }),
        }),
        {
            name: `${ID}.ui-settings`,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
