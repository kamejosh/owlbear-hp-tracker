import { create } from "zustand";
import { Item } from "@owlbear-rodeo/sdk";
import { LootMetadata } from "../helper/types.ts";
import { lootMetadataKey } from "../helper/variables.ts";

export type LootTokenContextType = {
    token: Item | null;
    setToken: (token: Item | null) => void;
    data: LootMetadata | null;
};

export const useLootTokenContext = create<LootTokenContextType>()((set) => ({
    token: null,
    data: null,
    setToken: (token: Item | null) =>
        set(() => {
            if (token !== null && lootMetadataKey in token.metadata) {
                const lootMetadata = token.metadata[lootMetadataKey] as LootMetadata;
                return { token: token, data: lootMetadata };
            }
            return { token: null, data: null };
        }),
}));
