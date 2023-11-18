import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { components } from "../schema";
import { TTRPG_URL } from "../../config.ts";
import { plausibleEvent } from "../../helper/helpers.ts";

export type PfStatblock = components["schemas"]["PFStatblockOut"];
export type PfSpell = components["schemas"]["src__types__pf__Spell"];

const fetchPfSearch = (
    search_string: string,
    take: number,
    skip: number,
    api_key?: string
): Promise<Array<PfStatblock>> => {
    let headers = {};
    if (api_key) {
        headers = {
            Authorization: `Bearer ${api_key}`,
        };
    }
    return axios
        .request({
            url: `${TTRPG_URL}/pf/statblock/search/`,
            headers: headers,
            params: {
                name: search_string,
                take: take,
                skip: skip,
            },
            method: "GET",
        })
        .then((response) => {
            return response.data as Array<PfStatblock>;
        });
};

const fetchPfStatblock = (slug: string, apiKey?: string): Promise<PfStatblock | null> => {
    let headers = {};
    if (apiKey) {
        headers = {
            Authorization: `Bearer ${apiKey}`,
        };
    }
    return axios
        .request({
            url: `${TTRPG_URL}/pf/statblock/${slug}`,
            headers: headers,
            method: "GET",
        })
        .then((response) => {
            if (!response.data) {
                return null;
            } else {
                return response.data as PfStatblock;
            }
        });
};

const fetchPfSpell = (slug: string, apiKey?: string): Promise<PfSpell | null> => {
    let headers = {};
    if (apiKey) {
        headers = {
            Authorization: `Bearer ${apiKey}`,
        };
    }
    return axios
        .request({
            url: `${TTRPG_URL}/pf/spell/${slug}`,
            headers: headers,
            method: "GET",
        })
        .then((response) => {
            if (!response.data) {
                return null;
            } else {
                return response.data as PfSpell;
            }
        });
};

export const usePfStatblockSearch = (search_string: string, take: number, skip: number, apiKey?: string) => {
    plausibleEvent("search-pf", search_string);
    return useQuery<Array<PfStatblock>>({
        queryKey: [search_string, take, skip, "search"],
        queryFn: () => fetchPfSearch(search_string, take, skip, apiKey),
        enabled: search_string !== "",
    });
};

export const usePfGetStatblock = (slug: string, apiKey?: string) => {
    return useQuery<PfStatblock | null>({
        queryKey: [slug, "slug"],
        queryFn: () => fetchPfStatblock(slug, apiKey),
        enabled: slug !== "",
    });
};

export const usePfGetSpell = (slug: string, apiKey?: string) => {
    return useQuery<PfSpell | null>({
        queryKey: [slug, "slug"],
        queryFn: () => fetchPfSpell(slug, apiKey),
        enabled: slug !== "",
    });
};
