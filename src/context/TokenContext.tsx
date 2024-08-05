import { HpTrackerMetadata } from "../helper/types.ts";
import { Image, Item } from "@owlbear-rodeo/sdk";
import { create } from "zustand";
import { itemMetadataKey } from "../helper/variables.ts";
import { objectsEqual } from "../helper/helpers.ts";

type TokenChange = {
    changeType: string;
    id: string;
    oldData: HpTrackerMetadata | null;
    newData: HpTrackerMetadata | null;
};

export type TokenMap = Map<string, { data: HpTrackerMetadata; item: Image }>;

export type TokenListContextType = {
    tokens: TokenMap | null;
    setTokens: (list: Array<Item>) => void;
    changeList: Array<TokenChange>;
};

export const useTokenListContext = create<TokenListContextType>()((set) => ({
    tokens: null,
    changeList: [],
    setTokens: (list) =>
        set((state) => {
            const start = new Date().getTime();
            const newTokens = new Map();
            const changes: Array<TokenChange> = [];
            list.forEach((item) => {
                if (itemMetadataKey in item.metadata) {
                    const metadata = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                    if (state.tokens && state.tokens.has(item.id)) {
                        newTokens.set(item.id, { data: metadata, item: item as Image });
                        if (!objectsEqual(metadata, state.tokens.get(item.id)!.data)) {
                            changes.push({
                                changeType: "update-metadata",
                                id: item.id,
                                oldData: state.tokens.get(item.id)!.data,
                                newData: metadata,
                            });
                        }
                    } else {
                        changes.push({ changeType: "new", id: item.id, oldData: null, newData: metadata });
                        newTokens.set(item.id, { data: metadata, item: item as Image });
                    }
                }
            });
            if (state.tokens) {
                [...state.tokens]
                    .filter((e) => !newTokens.has(e[0]))
                    .forEach((e) => {
                        changes.push({ changeType: "delete", id: e[0], oldData: e[1].data, newData: null });
                    });
            }
            const end = new Date().getTime();
            console.log(`set took: ${end - start}ms`);
            return { changeList: changes, tokens: newTokens };
        }),
}));
