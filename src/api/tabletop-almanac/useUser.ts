import { TTRPG_URL } from "../../config.ts";
import { components } from "../schema";
import axios from "axios";
import { useQuery, skipToken } from "@tanstack/react-query";

export type UserSettings = components["schemas"]["Settings"];

const getSettings = (url: string, apiKey?: string) => {
    let headers = {};
    if (apiKey) {
        headers = {
            Authorization: `Bearer ${apiKey}`,
        };
    }
    return axios
        .request({
            url: url,
            headers: headers,
            method: "GET",
        })
        .then((response) => {
            return response.data as UserSettings;
        });
};

export const useGetSettings = (apiKey?: string) => {
    const url = `${TTRPG_URL}/users/me/settings`;
    return useQuery<UserSettings>({
        queryKey: [url],
        queryFn: apiKey
            ? async () => {
                  return await getSettings(url, apiKey);
              }
            : skipToken,
        refetchInterval: Infinity,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
    });
};
