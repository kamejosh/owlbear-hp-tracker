import { useQuery } from "@tanstack/react-query";
import axios from "axios";

const baseUrl = "https://api.open5e.com/v1/monsters";

export type SearchResult = {
    slug: string;
    desc: string;
    name: string;
    size: string;
    type: string;
    subtype: string;
    group: string | null;
    alignment: string;
    armor_class: number;
    armor_desc: string;
    hit_points: number;
    hit_dice: string;
    speed: {
        walk: number;
        fly?: number;
        swim?: number;
    };
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
    strength_save: number | null;
    dexterity_save: number | null;
    constitution_save: number | null;
    intelligence_save: number | null;
    wisdom_save: number | null;
    charisma_save: number | null;
    perception: number;
    skills: {
        //TODO: define all possible skills
    };
    damage_vulnerabilities: string;
    damage_resistances: string;
    damage_immunities: string;
    condition_immunities: string;
    senses: string;
    languages: string;
    challenge_rating: string;
    cr: string;
    actions: Array<{ name: string; desc: string; attack_bonus?: number; damage_dice?: string; damage_bonus?: number }>;
    reactions: string;
    legendary_desc: string;
    legendary_actions: string | Array<{ name: string; desc: string }>;
    special_abilities: string | Array<{ name: string; desc: string }>;
    spell_list: Array<string>;
    page_no: number;
    environments: Array<string>;
};

type Results<T> = {
    results: Array<T>;
};

const fetchSearch = (search: string): Promise<Results<SearchResult>> => {
    return axios
        .request({
            url: `${baseUrl}?search=${search}`,
            method: "GET",
        })
        .then((response) => {
            return response.data as Results<SearchResult>;
        });
};

const fetchMonster = (slug: string): Promise<SearchResult> => {
    return axios
        .request({
            url: `${baseUrl}/${slug}`,
            method: "GET",
        })
        .then((response) => {
            return response.data as SearchResult;
        });
};

export const useOpen5eSearch = (search: string) => {
    return useQuery<Results<SearchResult>>({
        queryKey: ["search", search],
        queryFn: () => fetchSearch(search),
        enabled: search !== "",
    });
};

export const useGetOpen5eMonster = (slug: string) => {
    return useQuery<SearchResult>({
        queryKey: ["get", slug],
        queryFn: () => fetchMonster(slug),
        enabled: slug !== "",
    });
};
