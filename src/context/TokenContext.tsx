import { GMGMetadata } from "../helper/types.ts";
import { Image, Item } from "@owlbear-rodeo/sdk";
import { create } from "zustand";
import { itemMetadataKey } from "../helper/variables.ts";
import { objectsEqual } from "../helper/helpers.ts";
import { isEqual } from "lodash";

type TokenChange = {
    changeType: string;
    id: string;
    oldData: GMGMetadata | null;
    newData: GMGMetadata | null;
};

export type TokenMap = Map<string, { data: GMGMetadata; item: Image }>;

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
            const newTokens = new Map();
            const changes: Array<TokenChange> = [];
            list.forEach((item) => {
                if (itemMetadataKey in item.metadata) {
                    const metadata = item.metadata[itemMetadataKey] as GMGMetadata;
                    if (state.tokens && state.tokens.has(item.id)) {
                        newTokens.set(item.id, { data: metadata, item: item as Image });
                        if (!objectsEqual(metadata, state.tokens.get(item.id)!.data)) {
                            changes.push({
                                changeType: "update-metadata",
                                id: item.id,
                                oldData: state.tokens.get(item.id)!.data,
                                newData: metadata,
                            });
                        } else if (item.createdUserId !== state.tokens.get(item.id)!.item.createdUserId) {
                            changes.push({
                                changeType: "owner-changed",
                                id: item.id,
                                oldData: null,
                                newData: null,
                            });
                        } else if (item.visible !== state.tokens.get(item.id)!.item.visible) {
                            changes.push({
                                changeType: "visibility-changed",
                                id: item.id,
                                oldData: null,
                                newData: null,
                            });
                        } else if (!isEqual(item.position, state.tokens.get(item.id)!.item.position)) {
                            changes.push({
                                changeType: "position-changed",
                                id: item.id,
                                oldData: null,
                                newData: null,
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
            if (changes.length > 0) {
                return { changeList: changes, tokens: newTokens };
            }
            return state;
        }),
}));
