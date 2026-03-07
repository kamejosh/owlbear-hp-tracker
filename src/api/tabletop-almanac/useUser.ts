import { TTRPG_URL } from "../../config.ts";
import { components } from "../schema";
import axios, { AxiosResponse } from "axios";
import { useQuery, skipToken } from "@tanstack/react-query";

export type UserSettings = components["schemas"]["Settings"];
export type LoggedIn = components["schemas"]["LoggedIn"];

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
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
    });
};

const getLoggedIn = ({ url, apiKey }: { url: string; apiKey?: string }): Promise<AxiosResponse<LoggedIn>> => {
    let headers = {};
    if (apiKey) {
        headers = {
            Authorization: `Bearer ${apiKey}`,
        };
    }
    return axios.request({
        url: url,
        headers: headers,
    });
};

export const useGetLoggedIn = (apiKey?: string) => {
    const url = `${TTRPG_URL}/users/me/logged-in`;
    return useQuery<LoggedIn>({
        queryKey: [url, apiKey],
        queryFn: async () => {
            return (await getLoggedIn({ url, apiKey })).data;
        },
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        retry: 1,
    });
};
