import { ListPartiesParams, PartyPagination } from "../api/tabletop-almanac/useParty.ts";
import _ from "lodash";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { PartyStoreStatblock } from "../context/PartyStore.tsx";
import { itemMetadataKey, metadataKey } from "../helper/variables.ts";
import { GMGMetadata, RoomMetadata, SceneMetadata } from "../helper/types.ts";
import { updateSceneMetadata } from "../helper/helpers.ts";
import { useMetadataContext } from "../context/MetadataContext.ts";
import { partyStore } from "../context/PartyStore.tsx";
import { listParties } from "../api/tabletop-almanac/useParty.ts";
import { initItems } from "./init.ts";

let pollingTimeout: ReturnType<typeof setTimeout>;

export const startPartyPolling = async (params: ListPartiesParams) => {
    const addParty = partyStore.getState().addParty;
    const poll = async () => {
        try {
            // Grab the latest token straight from the Zustand store
            const roomMetadata = await OBR.room.getMetadata();
            const token =
                metadataKey in roomMetadata ? (roomMetadata[metadataKey] as RoomMetadata).tabletopAlmanacAPIKey : null;

            if (token) {
                const response = await listParties({ params, token });
                const newData = response.data as PartyPagination;

                newData.page.forEach((party) => {
                    addParty(party);
                });
            } else {
                console.warn("Polling skipped: No API key available.");
            }
        } catch (error) {
            console.error("Failed to poll parties:", error);
        } finally {
            // Schedule the next poll exactly 30 seconds after this one finishes
            pollingTimeout = setTimeout(poll, 30000);
        }
    };

    // Kick off the first request immediately
    poll();

    // Return a cleanup function so you can stop polling when needed
    return () => stopPartyPolling();
};

export const stopPartyPolling = () => {
    if (pollingTimeout) {
        clearTimeout(pollingTimeout);
    }
};

const initPlayerPartyMembers = async (items: Array<Item>) => {
    const currentParty = partyStore.getState().currentParty;
    const partyStatblocks = currentParty?.members.map((member) => member.statblock?.slug) || [];
    items.forEach((item) => {
        if (item.type === "IMAGE") {
            const image = item as Image;
            if (itemMetadataKey in item.metadata) {
                const data = item.metadata[itemMetadataKey] as GMGMetadata;

                if (data.sheet && partyStatblocks.includes(data.sheet)) {
                    const member = currentParty?.members.find((member) => member.statblock?.slug === data.sheet);

                    if (member) {
                        const newMember: PartyStoreStatblock = { ...member };

                        if (item.createdUserId !== member.playerId) {
                            newMember.playerId = item.createdUserId;
                        }

                        if (!member.imageUrl) {
                            newMember.imageUrl = image.image.url;
                        }

                        if (!_.isEqual(member, newMember)) {
                            partyStore.getState().updateMember(newMember);
                        }
                    }
                }
            }
        }
    });
};

export const initPlayerParty = async () => {
    const room = await OBR.room.getMetadata();
    if (metadataKey in room) {
        const roomMetadata = room[metadataKey] as RoomMetadata;
        const apiKey = roomMetadata.tabletopAlmanacAPIKey;
        if (apiKey) {
            try {
                await startPartyPolling({ limit: 100, offset: 0 });
                if (roomMetadata.partyId) {
                    partyStore.getState().setCurrentParty(roomMetadata.partyId);
                }
            } catch (e) {
                console.error("GM's Grimoire - Error while fetching parties", e);
            }
        }
    }

    const items = await OBR.scene.items.getItems();
    await initPlayerPartyMembers(items);

    OBR.room.onMetadataChange((metadata) => {
        const currentParty = partyStore.getState().currentParty;
        const room = useMetadataContext.getState().room;
        const gmgMetadata = metadata[metadataKey] as RoomMetadata;
        if (!_.isEqual(room, gmgMetadata) && gmgMetadata.partyId && gmgMetadata.partyId !== currentParty?.id) {
            partyStore.getState().setCurrentParty(gmgMetadata.partyId);
        }
    });

    OBR.scene.items.onChange((items) => {
        initPlayerPartyMembers(items);
    });
};

export const initParty = async () => {
    await startPartyPolling({ limit: 100, offset: 0 });
    // subscribe to party changes
    OBR.room.onMetadataChange((metadata) => {
        const room = useMetadataContext.getState().room;
        const gmgMetadata = metadata[metadataKey] as RoomMetadata;
        if (!_.isEqual(room, gmgMetadata) && gmgMetadata.partyId) {
            partyStore.getState().setCurrentParty(gmgMetadata.partyId);
        }
    });

    partyStore.subscribe(
        (state) => state.currentParty,
        async (currentParty) => {
            if (await OBR.scene.isReady()) {
                const sceneMetadata = await OBR.scene.getMetadata();
                const roomMetadata = await OBR.room.getMetadata();
                if (metadataKey in sceneMetadata && metadataKey in roomMetadata) {
                    const gmgScene = sceneMetadata[metadataKey] as SceneMetadata;
                    const gmgRoom = roomMetadata[metadataKey] as RoomMetadata;
                    if (
                        currentParty &&
                        gmgRoom.partyId === currentParty.id &&
                        gmgScene.groups &&
                        currentParty.group &&
                        !gmgScene.groups.includes(currentParty.group)
                    ) {
                        await updateSceneMetadata(gmgScene, { groups: [...gmgScene.groups, currentParty.group] });
                    }
                }
            }
        },
        { fireImmediately: true },
    );

    // subscribe to token changes
    OBR.scene.items.onChange(async (items) => {
        const newTokens: Array<Item> = [];
        const currentParty = partyStore.getState().currentParty;
        const partyStatblocks = currentParty?.members.map((member) => member.statblock?.slug) || [];
        items.forEach((item) => {
            if (item.type === "IMAGE" && (item.layer === "CHARACTER" || item.layer === "MOUNT")) {
                const image = item as Image;
                if (itemMetadataKey in item.metadata) {
                    const data = item.metadata[itemMetadataKey] as GMGMetadata;
                    if (data.sheet && partyStatblocks.includes(data.sheet)) {
                        const member = currentParty?.members.find((member) => member.statblock?.slug === data.sheet);
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
                                partyStore.getState().updateMember(newMember);
                            }
                        }
                    }
                } else {
                    const member = currentParty?.members.find((member) => member.imageUrl === image.image.url);
                    if (member && member.metadata && !_.isEqual(member.metadata, item.metadata)) {
                        void OBR.scene.items.updateItems([item], (items) => {
                            for (const i of items) {
                                // we checked before but this makes typescript happy
                                if (member.metadata) {
                                    let data = member.metadata[itemMetadataKey] as GMGMetadata;
                                    if (itemMetadataKey in member.metadata) {
                                        data.group = currentParty?.group;
                                    }
                                    i.metadata[itemMetadataKey] = data;
                                    newTokens.push(item);
                                }
                                if (member.playerId) {
                                    i.createdUserId = member.playerId;
                                }
                            }
                        });
                    }
                }
            }
        });

        if (newTokens.length > 0) {
            initItems();
        }
    });
};
