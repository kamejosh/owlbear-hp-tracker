import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { components } from "../schema";
import { TTRPG_URL } from "../../config.ts";

export type E5Statblock = components["schemas"]["E5StatblockOut"];
export type E5SpellSlot = components["schemas"]["SpellSlots-Output"];

const fetchE5Search = (
    search_string: string,
    take: number,
    skip: number,
    apiKey?: string,
): Promise<Array<E5Statblock>> => {
    let headers = {};
    if (apiKey) {
        headers = {
            Authorization: `Bearer ${apiKey}`,
        };
    }
    return axios
        .request({
            url: `${TTRPG_URL}/e5/statblock/search/`,
            headers: headers,
            params: {
                search_string: search_string,
                take: take,
                skip: skip,
            },
            method: "GET",
        })
        .then((response) => {
            return response.data as Array<E5Statblock>;
        });
};

const fetchStatblock = (slug: string, apiKey?: string): Promise<E5Statblock | null> => {
    let headers = {};
    if (apiKey) {
        headers = {
            Authorization: `Bearer ${apiKey}`,
        };
    }
    return axios
        .request({
            url: `${TTRPG_URL}/e5/statblock/${slug}`,
            headers: headers,
            method: "GET",
        })
        .then((response) => {
            if (!response.data) {
                return null;
            } else {
                return response.data as E5Statblock;
            }
        });
};

export const useE5SearchStatblock = (search_string: string, take: number, skip: number, apiKey?: string) => {
    return useQuery<Array<E5Statblock>>({
        queryKey: ["search", search_string, take, skip],
        queryFn: () => fetchE5Search(search_string, take, skip, apiKey),
        enabled: search_string !== "",
    });
};

export const useE5GetStatblock = (slug: string, apiKey?: string) => {
    return useQuery<E5Statblock | null>({
        queryKey: ["slug", slug],
        queryFn: () => fetchStatblock(slug, apiKey),
        enabled: slug !== "",
    });
};

export const useE5GetStatblockMutation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationKey: [],
        mutationFn: ({ slug, apiKey }: { slug: string; apiKey?: string }) => fetchStatblock(slug, apiKey),
        onSuccess: (data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["slug", variables.slug] });
            return data;
        },
    });
};
