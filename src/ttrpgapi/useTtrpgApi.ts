import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { components } from "./schema";
import { TTRPG_API_KEY, TTRPG_URL } from "../config.ts";

export type PFCreatureOut = components["schemas"]["PFCreatureOut"];
export type DnDCreatureOut = components["schemas"]["DnDCreatureOut"];
export type Ruleset = components["schemas"]["RulesetEnum"];
export type Cursor<T> = {
    size: number;
    last: string | null;
    data: Array<T>;
};

const fetchSearch5e = (
    search_string: string,
    limit: number = 50,
    last: string | null = null,
    user_id: string | null = null
): Promise<Cursor<DnDCreatureOut>> => {
    return axios
        .request({
            url: `${TTRPG_URL}/creature/5e/search/`,
            headers: {
                Authorization: `Bearer ${TTRPG_API_KEY}`,
            },
            params: {
                search_string: search_string,
                limit: limit,
                last: last,
                user_id: user_id,
            },
            method: "GET",
        })
        .then((response) => {
            return response.data as Cursor<DnDCreatureOut>;
        });
};

const fetchSearchPf = (
    search_string: string,
    limit: number = 50,
    last: string | null = null,
    user_id: string | null = null
): Promise<Cursor<PFCreatureOut>> => {
    return axios
        .request({
            url: `${TTRPG_URL}/creature/pf/search/`,
            headers: {
                Authorization: `Bearer ${TTRPG_API_KEY}`,
            },
            params: {
                search_string: search_string,
                limit: limit,
                last: last,
                user_id: user_id,
            },
            method: "GET",
        })
        .then((response) => {
            return response.data as Cursor<PFCreatureOut>;
        });
};

const fetchCreature = (slug: string): Promise<PFCreatureOut | DnDCreatureOut | null> => {
    return axios
        .request({
            url: `${TTRPG_URL}/creature/${slug}`,
            headers: {
                Authorization: `Bearer ${TTRPG_API_KEY}`,
            },
            method: "GET",
        })
        .then((response) => {
            if (!response.data) {
                return null;
            } else if (slug.includes("pf2e")) {
                return response.data as PFCreatureOut;
            } else {
                return response.data as DnDCreatureOut;
            }
        });
};

export const useTtrpgApiSearch5e = (
    search_string: string,
    limit: number = 50,
    last: string | null = null,
    user_id: string | null = null
) => {
    return useQuery<Cursor<DnDCreatureOut>>({
        queryKey: ["search", search_string, user_id, limit, last],
        queryFn: () => fetchSearch5e(search_string, limit, last, user_id),
        enabled: search_string !== "",
    });
};

export const useTtrpgApiSearchPf = (
    search_string: string,
    limit: number = 50,
    last: string | null = null,
    user_id: string | null = null
) => {
    return useQuery<Cursor<PFCreatureOut>>({
        queryKey: ["search", search_string, user_id, limit, last],
        queryFn: () => fetchSearchPf(search_string, limit, last, user_id),
        enabled: search_string !== "",
    });
};

export const useTtrpgApiGetCreature = (slug: string) => {
    return useQuery<PFCreatureOut | DnDCreatureOut | null>({
        queryKey: ["slug", slug],
        queryFn: () => fetchCreature(slug),
        enabled: slug !== "",
    });
};
