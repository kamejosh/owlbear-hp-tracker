import { TTRPG_URL } from "../../config.ts";
import { components, operations } from "../schema";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useMetadataContext } from "../../context/MetadataContext.ts";

export type Party = components["schemas"]["Party"];
export type PartyIn = components["schemas"]["PartyIn"];
export type PartyUpdate = components["schemas"]["PartyUpdate"];
export type PartyPagination = components["schemas"]["Pagination_PartyOut_"];
export type PartyOut = components["schemas"]["PartyOut"];
export type PartyInventoryOut = components["schemas"]["PartyInventoryOut"];
export type PartyItemOut = components["schemas"]["PartyItemOut"];
export type PartyInventoryUpdate = components["schemas"]["PartyInventoryUpdate"];
export type MoneyIn = components["schemas"]["MoneyIn"];
export type PartyStatblockOut = components["schemas"]["PartyStatblockOut"];
export type PartyStatblockIn = components["schemas"]["PartyStatblockIn"];
export type PartyStatblockUpdate = components["schemas"]["PartyStatblockUpdate"];
export type PartyStatblockEquipmentPage = components["schemas"]["Pagination_StatblockItemOut_"];
export type StatblockItemIn = components["schemas"]["StatblockItemIn"];
export type StatblockEquipmentUpdate = components["schemas"]["StatblockEquipmentUpdate"];
export type E5StatblockOut = components["schemas"]["E5StatblockOut"];
export type E5StatblockIn = components["schemas"]["E5StatblockIn"];

export const convertE5StatblockOutToStatblockIn = (
    statblockOut: E5StatblockOut,
    excludeItem: boolean = false,
): E5StatblockIn => {
    const spells = statblockOut.spells?.map((spell) => spell.id);
    const equipment = statblockOut.equipment?.map((e) => {
        if (!excludeItem) {
            return {
                item: e.item.id,
                equipped: e.equipped,
                proficient: e.proficient,
                embedded: e.embedded,
                loot: e.loot,
                attuned: e.attuned,
                itemOut: e.item,
                count: e.count,
            };
        } else {
            return {
                item: e.item.id,
                equipped: e.equipped,
                proficient: e.proficient,
                embedded: e.embedded,
                loot: e.loot,
                attuned: e.attuned,
                count: e.count,
            };
        }
    });
    return { ...statblockOut, spells: spells, equipment: equipment };
};

export type ListPartiesParams = NonNullable<operations["list_parties"]["parameters"]["query"]>;

export const listParties = async ({ params, token }: { params: ListPartiesParams; token: string }) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/`,
        headers: headers,
        method: "GET",
        params: params,
    });
};

export const useListParties = (params: ListPartiesParams) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;

    return useQuery({
        queryKey: ["parties"],
        queryFn: async () => {
            return (await listParties({ params: params, token: token || "" })).data as PartyPagination;
        },
    });
};

const getParty = async ({ partyId, token }: { partyId: number; token: string }) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}`,
        headers: headers,
        method: "GET",
    });
};

export const useGetParty = (partyId: number | undefined) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;

    return useQuery({
        queryKey: ["parties", partyId],
        queryFn: async () => {
            if (partyId === undefined) {
                throw new Error("Party ID is undefined");
            }
            return (await getParty({ partyId: partyId, token: token || "" })).data as PartyOut;
        },
        enabled: !!partyId,
        refetchOnWindowFocus: true,
    });
};

const getPartyInventory = async ({
    partyId,
    inventoryId,
    token,
}: {
    partyId: number;
    inventoryId: number;
    token: string;
}) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}/inventory/${inventoryId}`,
        headers: headers,
        method: "GET",
    });
};

export const useGetPartyInventory = (partyId: number | undefined, inventoryId: number | undefined) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;

    return useQuery({
        queryKey: ["partyInventory", partyId, inventoryId],
        queryFn: async () => {
            if (partyId === undefined || inventoryId === undefined) {
                throw new Error("Party ID or Inventory ID is undefined");
            }
            return (await getPartyInventory({ partyId, inventoryId, token: token || "" })).data;
        },
        enabled: !!partyId && !!inventoryId,
        refetchInterval: 10000,
        refetchOnWindowFocus: true,
    });
};

const deleteParty = async ({ partyId, token }: { partyId: number; token: string }) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}`,
        headers: headers,
        method: "DELETE",
    });
};

export const useDeleteParty = (partyId: number) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["party", partyId],
        mutationFn: async () => {
            return (await deleteParty({ partyId: partyId, token: token || "" })).data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });
};

const createParty = async ({ party, token }: { party: PartyIn; token: string }) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/`,
        headers: headers,
        data: party,
        method: "POST",
    });
};

export const useCreateParty = () => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["party"],
        mutationFn: async (party: PartyIn) => {
            return (await createParty({ party: party, token: token || "" })).data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });
};

const updateParty = async ({ partyId, party, token }: { partyId: number; party: PartyUpdate; token: string }) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}`,
        headers: headers,
        data: party,
        method: "PATCH",
    });
};

export const useUpdateParty = (partyId: number) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["party"],
        mutationFn: async (party: PartyUpdate) => {
            return (await updateParty({ party: party, partyId, token: token || "" })).data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });
};

const updatePartyMoney = async ({
    partyId,
    moneyId,
    money,
    token,
}: {
    partyId: number;
    moneyId: number;
    money: MoneyIn;
    token: string;
}) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}/money/${moneyId}`,
        headers: headers,
        data: money,
        method: "PUT",
    });
};

export const useUpdatePartyMoney = (partyId: number, moneyId: number | undefined) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["money"],
        mutationFn: async (money: MoneyIn) => {
            if (!moneyId) {
                return;
            } else {
                return (await updatePartyMoney({ partyId, moneyId, money, token: token || "" })).data;
            }
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["parties"] });
            await queryClient.invalidateQueries({ queryKey: ["player-parties"] });
        },
    });
};

export const addPartyStatblock = (partyId: number, partyStatblock: PartyStatblockIn, token: string) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}/statblock/`,
        headers: headers,
        data: partyStatblock,
        method: "POST",
    });
};

export const useAddPartyStatblock = (partyId: number) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["partyStatblock"],
        mutationFn: async (partyStatblock: PartyStatblockIn) => {
            return (await addPartyStatblock(partyId, partyStatblock, token || "")).data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });
};

const deletePartyStatblock = (partyId: number, statblockId: number, token: string) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}/statblock/${statblockId}`,
        headers: headers,
        method: "DELETE",
    });
};

export const useDeletePartyStatblock = (partyId: number, statblockId: number) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["partyStatblock"],
        mutationFn: async () => {
            return (await deletePartyStatblock(partyId, statblockId, token || "")).data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });
};

export const updatePartyStatblock = (
    partyId: number,
    statblockId: number,
    partyStatblock: PartyStatblockUpdate,
    token: string,
) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}/statblock/${statblockId}`,
        headers: headers,
        data: partyStatblock,
        method: "PATCH",
    });
};

export const useUpdatePartyStatblock = (partyId: number, statblockId: number) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["partyStatblock"],
        mutationFn: async (partyStatblock: PartyStatblockUpdate) => {
            return (await updatePartyStatblock(partyId, statblockId, partyStatblock, token || "")).data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["parties"] });
        },
    });
};

const listPlayerParties = async ({ params, token }: { params: ListPartiesParams; token: string }) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/player/`,
        headers: headers,
        method: "GET",
        params: params,
    });
};

export const useListPlayerParties = (params: ListPartiesParams) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;

    return useQuery({
        queryKey: ["player-parties"],
        queryFn: async () => {
            return (await listPlayerParties({ params: params, token: token || "" })).data;
        },
    });
};

const getPlayerStatblock = async ({ id, token }: { id: string; token: string }) => {
    const headers = {
        "X-API-Key": token,
    };

    return axios.request({
        url: `${TTRPG_URL}/party/player/statblock/${id}`,
        headers: headers,
        method: "GET",
    });
};

export const useGetPlayerStatblock = (id: string) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;

    return useQuery({
        queryKey: ["player-statblock", id],
        queryFn: async () => {
            return (await getPlayerStatblock({ id: id, token: token || "" })).data as E5StatblockOut;
        },
    });
};

export const updatePlayerStatblock = (id: string, statblockUpdate: E5StatblockIn, token: string) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/player/statblock/${id}`,
        headers: headers,
        data: statblockUpdate,
        method: "PATCH",
    });
};

export const useUpdatePlayerStatblock = (id: string, slug: string) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["player-statblock", id],
        mutationFn: async (statblockUpdate: E5StatblockIn) => {
            return (await updatePlayerStatblock(id, statblockUpdate, token || "")).data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["player-statblock", id] });
            await queryClient.invalidateQueries({ queryKey: ["slug", slug] });
        },
    });
};

export const resyncPlayerStatblock = (id: string, token: string) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/player/statblock/${id}/external`,
        headers: headers,
        method: "POST",
    });
};

export const useResyncPlayerStatblock = (id: string) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: ["player-statblock", id],
        mutationFn: async () => {
            return (await resyncPlayerStatblock(id, token || "")).data;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["player-statblock", id] });
        },
    });
};

const getPartySpells = ({
    party_id,
    name,
    id,
    token,
}: {
    party_id: number;
    name?: string;
    id?: string;
    token: string;
}) => {
    const headers = {
        "X-API-Key": token,
    };
    const nameFilter = { filter_value: name, filter_field: "name", filter_function: "contains" };
    const idFilter = { filter_value: id, filter_field: "id", filter_function: "equals" };
    const filter = name ? nameFilter : id ? idFilter : undefined;
    return axios.request({
        url: `${TTRPG_URL}/party/${party_id}/spells/`,
        headers: headers,
        params: {
            filter: JSON.stringify(filter),
            sort: JSON.stringify({ sort_field: "name", sort_order: "asc" }),
        },
        method: "GET",
    });
};

export const usePlayerGetPartySpells = (party_id: number) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;

    return useMutation({
        mutationKey: ["party-spells", party_id],
        mutationFn: async ({ name, id }: { name?: string; id?: string }) => {
            return (await getPartySpells({ party_id, name, id, token: token || "" })).data;
        },
    });
};

const updatePartyInventory = ({
    partyId,
    inventoryId,
    data,
    token,
}: {
    partyId: number;
    inventoryId: number;
    data: PartyInventoryUpdate;
    token: string | null | undefined;
}) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}/inventory/${inventoryId}`,
        headers: headers,
        data: data,
        method: "PUT",
    });
};

export const useUpdatePartyInventory = (partyId: number, inventoryId: number) => {
    const queryClient = useQueryClient();
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;

    return useMutation({
        mutationKey: ["partyInventory", partyId, inventoryId],
        mutationFn: async (data: PartyInventoryUpdate) => {
            return (
                await updatePartyInventory({ partyId: partyId, inventoryId: inventoryId, data: data, token: token })
            ).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["partyInventory", partyId, inventoryId] });
        },
    });
};

const listPartyStatblockEquipment = async ({
    partyId,
    party_statblock_id,
    token,
}: {
    partyId: number;
    party_statblock_id: number;
    token: string;
}) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}/statblock/${party_statblock_id}/equipment/`,
        headers: headers,
        params: { limit: 100 },
        method: "GET",
    });
};

export const useListPartyStatblockEquipment = (partyId: number, party_statblock_id: number) => {
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;

    return useQuery({
        queryKey: ["equipment", partyId, party_statblock_id],
        queryFn: async () => {
            return (
                await listPartyStatblockEquipment({
                    partyId: partyId,
                    party_statblock_id: party_statblock_id,
                    token: token || "",
                })
            ).data as PartyStatblockEquipmentPage;
        },
    });
};

const addPartyStatblockEquipment = ({
    partyId,
    partyStatblockId,
    data,
    token,
}: {
    partyId: number;
    partyStatblockId: number;
    data: StatblockItemIn;
    token: string | null | undefined;
}) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}/statblock/${partyStatblockId}/equipment/`,
        headers: headers,
        data: data,
        method: "POST",
    });
};

export const useAddPartyStatblockEquipment = (partyId: number) => {
    const queryClient = useQueryClient();
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;

    return useMutation({
        mutationKey: ["partyInventory", partyId],
        mutationFn: async (data: { data: StatblockItemIn; partyStatblockId: number }) => {
            return (
                await addPartyStatblockEquipment({
                    partyId: partyId,
                    partyStatblockId: data.partyStatblockId,
                    data: data.data,
                    token: token,
                })
            ).data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["partyInventory", partyId] });
            queryClient.invalidateQueries({ queryKey: ["equipment", partyId, variables.partyStatblockId] });
        },
    });
};

const updatePartyStatblockEquipment = ({
    partyId,
    partyStatblockId,
    equipmentId,
    data,
    token,
}: {
    partyId: number;
    partyStatblockId: number;
    equipmentId: number;
    data: StatblockEquipmentUpdate;
    token: string | null | undefined;
}) => {
    const headers = {
        "X-API-Key": token,
    };
    return axios.request({
        url: `${TTRPG_URL}/party/${partyId}/statblock/${partyStatblockId}/equipment/${equipmentId}`,
        headers: headers,
        data: data,
        method: "PUT",
    });
};

export const useUpdatePartyStatblockEquipment = (
    partyId: number,
    partyStatblockId: number,
    equipmentId: number,
    slug: string,
) => {
    const queryClient = useQueryClient();
    const token = useMetadataContext.getState().room?.tabletopAlmanacAPIKey;

    return useMutation({
        mutationKey: ["equipment", partyId, partyStatblockId, equipmentId],
        mutationFn: async (data: StatblockEquipmentUpdate) => {
            return (
                await updatePartyStatblockEquipment({
                    partyId: partyId,
                    partyStatblockId: partyStatblockId,
                    equipmentId: equipmentId,
                    data: data,
                    token: token,
                })
            ).data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ["equipment", partyId, partyStatblockId],
            });
            queryClient.invalidateQueries({
                queryKey: ["slug", slug],
            });
        },
    });
};
