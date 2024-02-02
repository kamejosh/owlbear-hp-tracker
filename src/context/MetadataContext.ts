import { create } from "zustand";
import { RoomMetadata, SceneMetadata } from "../helper/types.ts";

export type MetadataContextType = {
    scene: SceneMetadata | null;
    room: RoomMetadata | null;
    setSceneMetadata: (data: Partial<SceneMetadata>) => void;
    setRoomMetadata: (data: Partial<RoomMetadata>) => void;
};

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
