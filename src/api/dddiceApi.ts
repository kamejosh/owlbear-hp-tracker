import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const dddiceUrl = "https://dddice.com/api/1.0";

const listThemes = async (apikey: string) => {
    return axios
        .request({
            url: `${dddiceUrl}/dice-box`,
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
    return useQuery({
        queryKey: ["themes"],
        queryFn: async () => {
            return await listThemes(apikey);
        },
        enabled: apikey !== "",
    });
};
