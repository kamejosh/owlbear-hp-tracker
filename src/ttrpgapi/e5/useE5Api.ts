import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { components } from "../schema";
import { TTRPG_URL } from "../../config.ts";

export type E5Statblock = components["schemas"]["E5StatblockOut"];

const fetchE5Search = (
    search_string: string,
    take: number,
    skip: number,
    apiKey?: string
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
                name: search_string,
                take: take,
                skip: skip,
            },
            method: "GET",
        })
        .then((response) => {
            return response.data as Array<E5Statblock>;
        });
};

const fetchCreature = (slug: string, apiKey?: string): Promise<E5Statblock | null> => {
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

export const useE5SearchCreature = (search_string: string, take: number, skip: number, apiKey?: string) => {
    return useQuery<Array<E5Statblock>>({
        queryKey: ["search", search_string, take, skip],
        queryFn: () => fetchE5Search(search_string, take, skip, apiKey),
        enabled: search_string !== "",
    });
};

export const useE5GetCreature = (slug: string, apiKey?: string) => {
    return useQuery<E5Statblock | null>({
        queryKey: ["slug", slug],
        queryFn: () => fetchCreature(slug, apiKey),
        enabled: slug !== "",
    });
};
