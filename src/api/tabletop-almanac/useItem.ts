import axios from "axios";
import { TTRPG_URL } from "../../config.ts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ItemOut } from "../../helper/equipmentHelpers.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { components } from "../schema";

export type LootRequest = components["schemas"]["LootRequest"];

const searchItem = (search: string, token?: string | null) => {
    let headers = {};
    let params = {};
    if (token) {
        headers = {
            Authorization: `Bearer ${token}`,
        };
    }
    if (search) {
        params = {
            search_string: search,
        };
    }
    return axios.request({
        url: `${TTRPG_URL}/e5/item/search`,
        params: params,
        headers: headers,
        method: "GET",
    });
};

export const useSearchItems = () => {
    const token = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);

    return useMutation<Array<ItemOut>, unknown, { search: string }>({
        mutationKey: ["item", "search", token ?? ""],
        mutationFn: async ({ search }: { search: string }) => {
            const response = await searchItem(search, token);
            return response.data as Array<ItemOut>;
        },
    });
};

const getItem = (token: string, slug: string) => {
    return axios.request({
        url: `${TTRPG_URL}/e5/item/${slug}`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
        method: "GET",
    });
};

export const useGetItem = (slug: string) => {
    const token = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);
    return useQuery<ItemOut, unknown>({
        queryKey: ["item", slug, token ?? ""],
        queryFn: async () => {
            const response = await getItem(token ?? "", slug);
            return response.data as ItemOut;
        },
    });
};

const getLoot = (lootRequest: LootRequest, token: string) => {
    return axios.request({
        url: `${TTRPG_URL}/e5/item/loot`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
        method: "POST",
        data: lootRequest,
    });
};

export const useGetLoot = () => {
    const token = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);

    return useMutation<Array<ItemOut>, unknown, LootRequest>({
        mutationKey: ["loot", token ?? ""],
        mutationFn: async (lootRequest: LootRequest) => {
            const response = await getLoot(lootRequest, token ?? "");
            return response.data as Array<ItemOut>;
        },
    });
};

const getItemTypes = (token: string) => {
    return axios.request({
        url: `${TTRPG_URL}/e5/item/types`,
        headers: {
            Authorization: `Bearer ${token}`,
        },
        method: "POST",
    });
};

export const useGetItemTypes = () => {
    const token = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);

    return useQuery<Array<string>, unknown>({
        queryKey: ["item-types", token ?? ""],
        queryFn: async () => {
            const response = await getItemTypes(token ?? "");
            return response.data as Array<string>;
        },
    });
};
