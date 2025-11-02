import { create } from "zustand";
import { RoomMetadata, SceneMetadata } from "../helper/types.ts";
import { UserSettings } from "../api/tabletop-almanac/useUser.ts";
import { createJSONStorage, persist } from "zustand/middleware";
import { ID } from "../helper/variables.ts";

export type MetadataContextType = {
    scene: SceneMetadata | null;
    room: RoomMetadata | null;
    setSceneMetadata: (data: Partial<SceneMetadata>) => void;
    setRoomMetadata: (data: Partial<RoomMetadata>) => void;
};

export type TaSettingsStoreType = {
    taSettings: UserSettings;
    setTaSettings: (settings: UserSettings) => void;
};

export const useTaSettingsStore = create<TaSettingsStoreType>()(
    persist<TaSettingsStoreType>(
        (set) => ({
            taSettings: {
                crit_rules: "double_role",
                death_saves: false,
                gm_rolls_hidden: false,
                sync_pretty_sordid: false,
                default_groups: [],
                assign_ss_darkvision: false,
                notify_next_turn: false,
                default_token_settings: {
                    hpOnMap: false,
                    acOnMap: false,
                    playerList: false,
                    playerMap: { hp: false, ac: false },
                },
            },
            setTaSettings: (settings) =>
                set(() => {
                    return { taSettings: { ...settings } };
                }),
        }),
        {
            name: `${ID}.ta-settings`,
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

export const useMetadataContext = create<MetadataContextType>()((set) => ({
    scene: null,
    room: null,
    setSceneMetadata: (data) =>
        set((state) => {
            return { scene: { ...state.scene, ...data } };
        }),
    setRoomMetadata: (data) =>
        set((state) => {
            return { room: { ...state.room, ...data } };
        }),
}));
