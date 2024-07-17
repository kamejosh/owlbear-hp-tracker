import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";

const dddiceUrl = "https://dddice.com/api/1.0";

const listThemes = async (apikey: string, url?: string) => {
    return axios
        .request({
            url: url ?? `${dddiceUrl}/dice-box`,
            headers: {
                Authorization: `Bearer ${apikey}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
        .then((response) => {
            if (response.status === 200) {
                return response.data;
            }
            return null;
        });
};

export const useListThemes = (apikey: string) => {
    return useInfiniteQuery({
        queryKey: ["themes"],
        queryFn: async ({ pageParam }) => {
            return await listThemes(apikey, pageParam);
        },
        initialPageParam: `${dddiceUrl}/dice-box`,
        getNextPageParam: (lastPage) => {
            return lastPage.links.next;
        },
        enabled: apikey !== "",
    });
};

const listRooms = async (apikey: string, url?: string) => {
    return axios
        .request({
            url: url ?? `${dddiceUrl}/room`,
            headers: {
                Authorization: `Bearer ${apikey}`,
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        })
        .then((response) => {
            if (response.status === 200) {
                return response.data;
            }
            return null;
        });
};

export const useListRooms = (apikey: string) => {
    return useInfiniteQuery({
        queryKey: ["rooms"],
        queryFn: async ({ pageParam }) => {
            return await listRooms(apikey, pageParam);
        },
        initialPageParam: `${dddiceUrl}/room`,
        getNextPageParam: (lastPage) => {
            return lastPage.links.next;
        },
        enabled: apikey !== "",
    });
};
