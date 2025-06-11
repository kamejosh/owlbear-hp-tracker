import { create } from "zustand";
import { RoomMetadata, SceneMetadata } from "../helper/types.ts";
import { UserSettings } from "../api/tabletop-almanac/useUser.ts";

export type MetadataContextType = {
    scene: SceneMetadata | null;
    room: RoomMetadata | null;
    setSceneMetadata: (data: Partial<SceneMetadata>) => void;
    setRoomMetadata: (data: Partial<RoomMetadata>) => void;
    taSettings: UserSettings;
    setTaSettings: (settings: UserSettings) => void;
};

export const useMetadataContext = create<MetadataContextType>()((set) => ({
    scene: null,
    room: null,
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
    setSceneMetadata: (data) =>
        set((state) => {
            return { scene: { ...state.scene, ...data } };
        }),
    setRoomMetadata: (data) =>
        set((state) => {
            return { room: { ...state.room, ...data } };
        }),
    setTaSettings: (settings) =>
        set(() => {
            return { taSettings: { ...settings } };
        }),
}));
