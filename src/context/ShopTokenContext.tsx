import { create } from "zustand";
import { Item } from "@owlbear-rodeo/sdk";
import { ShopMetadata } from "../helper/types.ts";
import { shopMetadataKey } from "../helper/variables.ts";

export type ShopTokenContextType = {
    token: Item | null;
    setToken: (token: Item | null) => void;
    data: ShopMetadata | null;
    setData: (data: ShopMetadata | null) => void;
};

export const useShopTokenContext = create<ShopTokenContextType>()((set) => ({
    token: null,
    data: null,
    setToken: (token: Item | null) =>
        set(() => {
            if (token !== null) {
                if (shopMetadataKey in token.metadata) {
                    const shopMetadata = token.metadata[shopMetadataKey] as ShopMetadata;
                    return { token: token, data: shopMetadata };
                }
                return { token: token, data: null };
            }
            return { token: null, data: null };
        }),
    setData: (data: ShopMetadata | null) =>
        set(() => {
            return { data: data };
        }),
}));
