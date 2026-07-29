import { ListPartiesParams, PartyPagination } from "../api/tabletop-almanac/useParty.ts";
import _ from "lodash";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { PartySettings, PartyStoreStatblock } from "../context/PartyStore.tsx";
import { itemMetadataKey, metadataKey } from "../helper/variables.ts";
import { GMGMetadata, RoomMetadata, SceneMetadata } from "../helper/types.ts";
import { getCurrentParty, getPartyId, updateSceneMetadata } from "../helper/helpers.ts";
import { partyStore } from "../context/PartyStore.tsx";
import { listParties } from "../api/tabletop-almanac/useParty.ts";
import { updateHp } from "../helper/hpHelpers.ts";
import { updateAc } from "../helper/acHelper.ts";
import { updateItems } from "../helper/obrHelper.ts";

let pollingTimeout: ReturnType<typeof setTimeout> | null = null;
let failedToken: string | null = null;
let retryCount = 0;

export const startPartyPolling = async (params: ListPartiesParams) => {
    stopPartyPolling();
    const addParty = partyStore.getState().addParty;
    const poll = async () => {
        try {
            // Grab the latest token straight from the Zustand store
            const roomMetadata = await OBR.room.getMetadata();
            const token =
                metadataKey in roomMetadata ? (roomMetadata[metadataKey] as RoomMetadata).tabletopAlmanacAPIKey : null;

            if (token) {
                if (token === failedToken) {
                    return;
                }

                try {
                    const response = await listParties({ params, token });
                    const newData = response.data as PartyPagination;

                    newData.page.forEach((party) => {
                        addParty(party);
                    });

                    // Reset on success
                    retryCount = 0;
                    failedToken = null;
                } catch (error: any) {
                    if (error?.status === 401 || error?.response?.status === 401) {
                        retryCount++;
                        if (retryCount >= 2) {
                            failedToken = token;
                            console.warn("Game Master's Grimoire - Syncing Parties stopped: Unauthorized");
                            return;
                        }
                    }
                    console.error("Game Master's Grimoire - Failed to fetch parties:", error);
                }
            } else {
                return;
            }
        } catch (error) {
            console.error("Game Master's Grimoire - Failed to fetch parties:", error);
        } finally {
            // Schedule the next poll exactly 30 seconds after this one finishes
            // Only if we haven't returned early (halted)
            if (!failedToken) {
                const roomMetadata = await OBR.room.getMetadata();
                const token =
                    metadataKey in roomMetadata
                        ? (roomMetadata[metadataKey] as RoomMetadata).tabletopAlmanacAPIKey
                        : null;
                if (token) {
                    pollingTimeout = setTimeout(poll, 30000);
                }
            }
        }
    };

    // Kick off the first request immediately
    await poll();

    // Return a cleanup function so you can stop polling when needed
    return () => stopPartyPolling();
};

export const stopPartyPolling = () => {
    if (pollingTimeout) {
        clearTimeout(pollingTimeout);
        pollingTimeout = null;
    }
};

const initPlayerPartyMembers = async (items: Array<Item>) => {
    const partyId = await getPartyId();
    const currentParty = await getCurrentParty();
    const membersToUpdate: PartyStoreStatblock[] = [];
    items.forEach((item) => {
        if (item.type === "IMAGE" && itemMetadataKey in item.metadata) {
            const image = item as Image;
            const data = item.metadata[itemMetadataKey] as GMGMetadata;
            const member = data.sheet
                ? currentParty?.members.find((member) => member.statblock?.slug === data.sheet)
                : undefined;

            if (member) {
                const newMember: PartyStoreStatblock = { ...member };

                if (item.createdUserId !== member.playerId) {
                    newMember.playerId = item.createdUserId;
                }

                if (!member.imageUrl) {
                    newMember.imageUrl = image.image.url;
                }

                if (!_.isEqual(member, newMember)) {
                    membersToUpdate.push(newMember);
                }
            }
        }
    });

    if (membersToUpdate.length > 0 && partyId) {
        partyStore.getState().updateMembers(partyId, membersToUpdate);
    }
};

export const initPlayerParty = async () => {
    const room = await OBR.room.getMetadata();
    if (metadataKey in room) {
        const roomMetadata = room[metadataKey] as RoomMetadata;
        const apiKey = roomMetadata.tabletopAlmanacAPIKey;
        if (apiKey) {
            try {
                await startPartyPolling({ limit: 100, offset: 0 });
            } catch (e) {
                console.error("GM's Grimoire - Error while fetching parties", e);
            }
        }
    }

    const items = await OBR.scene.items.getItems();
    await initPlayerPartyMembers(items);

    OBR.room.onMetadataChange((metadata) => {
        const gmgMetadata = metadata[metadataKey] as RoomMetadata;
        if (gmgMetadata) {
            const apiKey = gmgMetadata.tabletopAlmanacAPIKey;
            if (apiKey && apiKey !== failedToken && !pollingTimeout) {
                void startPartyPolling({ limit: 100, offset: 0 });
            }
        }
    });

    OBR.scene.items.onChange((items) => {
        initPlayerPartyMembers(items);
    });
};

const findPartyMember = (item: Item, currentParty: PartySettings) => {
    const image = item as Image;
    if (itemMetadataKey in item.metadata) {
        const data = item.metadata[itemMetadataKey] as GMGMetadata;
        return data.sheet ? currentParty.members.find((member) => member.statblock?.slug === data.sheet) : undefined;
    }
    return currentParty.members.find((member) => member.imageUrl === image.image.url);
};

/** Stamps `member`'s stored metadata onto `item` in place. Returns true if the metadata changed. */
const applyMemberToItem = (item: Item, member: PartyStoreStatblock | undefined, group: string | undefined): boolean => {
    let metadataChanged = false;
    if (member?.metadata && !_.isEqual(member.metadata, item.metadata)) {
        const data = { ...member.metadata };
        if (itemMetadataKey in member.metadata) {
            data[itemMetadataKey] = { ...(member.metadata[itemMetadataKey] as GMGMetadata), group };
        }
        item.metadata = data;
        metadataChanged = true;
    }
    if (member?.playerId && member.playerId !== item.createdUserId) {
        item.createdUserId = member.playerId;
    }
    return metadataChanged;
};

/** Refreshes the HP/AC display of tokens whose GMG metadata was just changed. */
const refreshTokenDisplays = async (tokenIds: Array<string>) => {
    if (tokenIds.length === 0) {
        return;
    }
    const tokens = await OBR.scene.items.getItems(tokenIds);
    for (const token of tokens) {
        if (itemMetadataKey in token.metadata) {
            const metadata = token.metadata[itemMetadataKey] as GMGMetadata;
            await updateHp(token, metadata);
            await updateAc(token, metadata);
        }
    }
};

/**
 * Forces every party token already present in the scene to take on the values currently stored
 * for its party member, instead of only applying them when a token is first matched to the party.
 * Runs on scene switch so stale values from a previous session don't linger.
 */
export const applyPartyToTokens = async () => {
    const currentParty = await getCurrentParty();
    if (!currentParty || currentParty.members.length === 0) {
        return;
    }

    const items = await OBR.scene.items.getItems(
        (item) => item.type === "IMAGE" && (item.layer === "CHARACTER" || item.layer === "MOUNT"),
    );

    const membersByItemId = new Map<string, PartyStoreStatblock>();
    for (const item of items) {
        const member = findPartyMember(item, currentParty);
        if (
            member &&
            ((member.metadata && !_.isEqual(member.metadata, item.metadata)) ||
                (member.playerId && member.playerId !== item.createdUserId))
        ) {
            membersByItemId.set(item.id, member);
        }
    }

    if (membersByItemId.size === 0) {
        return;
    }

    const newTokens: Array<Item> = [];
    await OBR.scene.items.updateItems([...membersByItemId.keys()], (items) => {
        for (const item of items) {
            if (applyMemberToItem(item, membersByItemId.get(item.id), currentParty.group)) {
                newTokens.push(item);
            }
        }
    });

    await refreshTokenDisplays(newTokens.map((t) => t.id));
};

export const initParty = async () => {
    await startPartyPolling({ limit: 100, offset: 0 });

    // re-apply the latest party values to tokens whenever a scene is opened, so tokens that
    // already carry metadata from a previous session don't keep stale values
    OBR.scene.onReadyChange(async (isReady) => {
        if (isReady) {
            await applyPartyToTokens();
        }
    });
    if (await OBR.scene.isReady()) {
        await applyPartyToTokens();
    }

    // subscribe to party changes
    OBR.room.onMetadataChange(async (metadata) => {
        const gmgMetadata = metadata[metadataKey] as RoomMetadata;
        if (gmgMetadata) {
            const apiKey = gmgMetadata.tabletopAlmanacAPIKey;
            if (apiKey && apiKey !== failedToken && !pollingTimeout) {
                void startPartyPolling({ limit: 100, offset: 0 });
            }
            if (gmgMetadata.partyId) {
                const sceneMetadata = await OBR.scene.getMetadata();
                if (metadataKey in sceneMetadata) {
                    const currentParty = await getCurrentParty();
                    const gmgScene = sceneMetadata[metadataKey] as SceneMetadata;
                    const sceneGroups = gmgScene.groups ?? [];
                    if (currentParty && !sceneGroups.includes(currentParty.group)) {
                        await updateSceneMetadata(gmgScene, { groups: [...sceneGroups, currentParty.group] });
                    }
                }
            }
        }
    });

    // subscribe to token changes
    OBR.scene.items.onChange(async (items) => {
        const newTokenIds: Array<string> = [];
        const partyId = await getPartyId();
        const currentParty = await getCurrentParty();
        const membersToUpdate: PartyStoreStatblock[] = [];
        const itemsToApply: Array<string> = [];

        items.forEach((item) => {
            if (item.type === "IMAGE" && (item.layer === "CHARACTER" || item.layer === "MOUNT")) {
                const image = item as Image;
                const member = currentParty ? findPartyMember(item, currentParty) : undefined;
                if (itemMetadataKey in item.metadata) {
                    if (member) {
                        const newMember: PartyStoreStatblock = { ...member };

                        if (item.createdUserId !== OBR.player.id && item.createdUserId !== member.playerId) {
                            newMember.playerId = item.createdUserId;
                        }

                        if (!member.imageUrl) {
                            newMember.imageUrl = image.image.url;
                        }

                        if (!_.isEqual(member.metadata, item.metadata)) {
                            newMember.metadata = item.metadata;
                        }

                        if (!_.isEqual(member, newMember)) {
                            membersToUpdate.push(newMember);
                        }
                    }
                } else if (member?.metadata && !_.isEqual(member.metadata, item.metadata)) {
                    itemsToApply.push(item.id);
                }
            }
        });

        if (membersToUpdate.length > 0 && partyId) {
            partyStore.getState().updateMembers(partyId, membersToUpdate);
        }

        // Batch all metadata applications into a single rate-limit-aware update instead of
        // firing one unbatched updateItems per token (which overruns OBR's rate limit).
        if (itemsToApply.length > 0 && currentParty) {
            await updateItems(itemsToApply, (drafts) => {
                for (const draft of drafts) {
                    const member = findPartyMember(draft, currentParty);
                    if (member && applyMemberToItem(draft, member, currentParty.group)) {
                        newTokenIds.push(draft.id);
                    }
                }
            });
        }

        await refreshTokenDisplays(newTokenIds);
    });
};
