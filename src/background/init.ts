import OBR, { Image, Item, Metadata } from "@owlbear-rodeo/sdk";
import { changelogModal, ID, itemMetadataKey, metadataKey, nextTurnChannel, version } from "../helper/variables.ts";
import { compare } from "compare-versions";
import {
    ACItemChanges,
    BarItemChanges,
    DICE_ROLLER,
    GMGMetadata,
    RoomMetadata,
    SceneMetadata,
    TextItemChanges,
} from "../helper/types.ts";
import {
    saveOrChangeBar,
    saveOrChangeText,
    updateBarChanges,
    updateHp,
    updateTextChanges,
    updateTextVisibility,
} from "../helper/hpHelpers.ts";
import { v4 as uuidv4 } from "uuid";
import { saveOrChangeAC, updateAc, updateAcChanges, updateAcVisibility } from "../helper/acHelper.ts";
import { attachmentFilter, getAttachedItems, prepareTokenForGrimoire, updateSceneMetadata } from "../helper/helpers.ts";
import { setupDddice } from "./dddice.ts";
import { migrate102To103 } from "../migrations/v103.ts";
import { migrate105To106 } from "../migrations/v106.ts";
import { migrate111To112 } from "../migrations/v112.ts";
import { migrate112To113 } from "../migrations/v113.ts";
import { migrateTo140 } from "../migrations/v140.ts";
import { migrateTo141 } from "../migrations/v141.ts";
import { migrateTo160 } from "../migrations/v160.ts";
import { migrateTo200 } from "../migrations/v200.ts";
import { migrateTo300 } from "../migrations/v300.ts";
import { updateItems } from "../helper/obrHelper.ts";
import { updateTokenMetadata } from "../helper/tokenHelper.ts";
import { migrateTo350 } from "../migrations/v350.ts";
import { setupDicePlus } from "./diceplus.ts";
import { registerMessageHandlers } from "./api.ts";
import _, { isNull, isUndefined } from "lodash";
import { useMetadataContext } from "../context/MetadataContext.ts";
import { partyStore, PartyStoreStatblock } from "../context/PartyStore.tsx";
import { listParties, PartyPagination } from "../api/tabletop-almanac/useParty.ts";

/**
 * All character items get the default values for the HpTrackeMetadata.
 * This ensures that further handling can be done properly
 */
const initItems = async () => {
    const tokens = await OBR.scene.items.getItems(
        (item) => itemMetadataKey in item.metadata && (item.metadata[itemMetadataKey] as GMGMetadata).hpTrackerActive,
    );

    const barChanges = new Map<string, BarItemChanges>();
    const textChanges = new Map<string, TextItemChanges>();
    const acChanges = new Map<string, ACItemChanges>();

    for (const token of tokens) {
        const data = token.metadata[itemMetadataKey] as GMGMetadata;
        const barAttachments = (await getAttachedItems(token.id, ["SHAPE"])).filter((a) => attachmentFilter(a, "BAR"));
        const textAttachments = (await getAttachedItems(token.id, ["TEXT"])).filter((a) => attachmentFilter(a, "HP"));
        const acAttachments = (await getAttachedItems(token.id, ["CURVE"])).filter((a) => attachmentFilter(a, "AC"));

        if (data.hpBar) {
            await saveOrChangeBar(token, data, barAttachments, barChanges);
        }
        if (data.hpOnMap) {
            await saveOrChangeText(token, data, textAttachments, textChanges);
        }
        if (data.acOnMap) {
            await saveOrChangeAC(token, data, acAttachments, acChanges, token.visible && !!data.playerMap?.ac);
        }
    }

    await updateAcChanges(acChanges);
    await updateBarChanges(barChanges);
    await updateTextChanges(textChanges);
    console.info("GM's Grimoire - Token initialization done");
};

const initRoom = async () => {
    const metadata: Metadata = await OBR.room.getMetadata();
    const ownMetadata: Metadata = {};
    if (!(metadataKey in metadata)) {
        const roomData: RoomMetadata = {
            allowNegativeNumbers: false,
            hpBarSegments: 0,
            hpBarOffset: 0,
            acOffset: { x: 0, y: 0 },
            acShield: true,
            playerSort: true,
            statblockPopover: { width: 500, height: 600 },
            initiativeDice: 20,
            ruleset: "e5",
            ignoreUpdateNotification: false,
            diceRoller: DICE_ROLLER.DDDICE,
        };
        ownMetadata[metadataKey] = roomData;
    } else {
        const roomData = metadata[metadataKey] as RoomMetadata;
        if (roomData.ruleset !== "pf" && roomData.ruleset !== "e5") {
            roomData.ruleset = "e5";
        }
        if (isNull(roomData.diceRoller) || isUndefined(roomData.diceRoller)) {
            roomData.diceRoller = DICE_ROLLER.SIMPLE;
        }
    }
    await OBR.room.setMetadata(ownMetadata);
};

const initScene = async () => {
    const metadata: Metadata = await OBR.scene.getMetadata();
    const ownMetadata: Metadata = {};
    if (!(metadataKey in metadata)) {
        const sceneData: SceneMetadata = {
            version: version,
            id: uuidv4(),
            groups: ["Default"],
            openGroups: ["Default"],
            collapsedStatblocks: [],
            openStatblocks: [],
            statblockPopoverOpen: {},
        };

        ownMetadata[metadataKey] = sceneData;
    } else {
        const sceneData = metadata[metadataKey] as SceneMetadata;

        if (!sceneData.id) {
            sceneData.id = uuidv4();
        }
        if (!sceneData.groups || sceneData.groups.length === 0) {
            sceneData.groups = ["Default"];
        }
        if (sceneData.openGroups === undefined) {
            sceneData.openGroups = ["Default"];
        }
        if (!sceneData.collapsedStatblocks) {
            sceneData.collapsedStatblocks = [];
        }

        sceneData.statblockPopoverOpen = {};

        ownMetadata[metadataKey] = sceneData;
    }
    await OBR.scene.setMetadata(ownMetadata);
};

const setupContextMenu = async () => {
    await OBR.contextMenu.create({
        id: `${ID}/popover`,
        icons: [
            {
                icon: "/iconPopover.svg",
                label: "GM's Grimoire",
                filter: {
                    some: [{ key: ["metadata", `${itemMetadataKey}`, "hpTrackerActive"], value: true }],
                    roles: ["GM"],
                },
            },
            {
                icon: "/iconPopover.svg",
                label: "GM's Grimoire",
                filter: {
                    every: [
                        { key: ["metadata", `${itemMetadataKey}`, "hpTrackerActive"], value: true, coordinator: "&&" },
                        {
                            key: ["createdUserId"],
                            value: OBR.player.id,
                        },
                    ],
                    roles: ["PLAYER"],
                },
            },
        ],
        embed: {
            url: "/popover.html",
            height: 100,
        },
    });

    await OBR.contextMenu.create({
        id: `${ID}/remove`,
        icons: [
            {
                icon: "/iconOff.svg",
                label: "Remove from Grimoire",
                filter: {
                    some: [{ key: ["metadata", `${itemMetadataKey}`, "hpTrackerActive"], value: true }],
                    roles: ["GM"],
                },
            },
        ],
        onClick: async (context) => {
            const contextItems = context.items.filter(
                (i) => itemMetadataKey in i.metadata && (i.metadata[itemMetadataKey] as GMGMetadata).hpTrackerActive,
            );
            await updateItems(
                contextItems.map((i) => i.id),
                (items) => {
                    items.forEach((item) => {
                        if (itemMetadataKey in item.metadata) {
                            const data = item.metadata[itemMetadataKey] as GMGMetadata;
                            item.metadata[itemMetadataKey] = { ...data, hpTrackerActive: false };
                        }
                    });
                },
            );
        },
    });

    await OBR.contextMenu.create({
        id: `${ID}/add-to-grimoire`,
        icons: [
            {
                icon: "/icon.svg",
                label: "Add to Grimoire",
                filter: {
                    every: [
                        { key: ["metadata", `${itemMetadataKey}`], value: undefined, coordinator: "||" },
                        {
                            key: ["metadata", `${itemMetadataKey}`, "hpTrackerActive"],
                            value: false,
                        },
                    ],
                    some: [
                        { key: "type", value: "IMAGE", coordinator: "&&" },
                        { key: "layer", value: "CHARACTER", coordinator: "||" },
                        { key: "layer", value: "MOUNT", coordinator: "||" },
                    ],
                    roles: ["GM"],
                },
            },
        ],
        onClick: async (context) => {
            const contextItems = context.items.filter(
                (i) => (i.layer === "CHARACTER" || i.layer === "MOUNT") && i.type === "IMAGE",
            );

            const tokenIds = await prepareTokenForGrimoire(contextItems as Array<Image>);
            const tokens = await OBR.scene.items.getItems(tokenIds);
            for (const token of tokens) {
                if (itemMetadataKey in token.metadata) {
                    const metadata = token.metadata[itemMetadataKey] as GMGMetadata;
                    await updateHp(token, metadata);
                    await updateAc(token, metadata);
                }
            }
        },
    });

    await OBR.contextMenu.create({
        id: `${ID}/add-prop-to-grimoire`,
        icons: [
            {
                icon: "/icon.svg",
                label: "Add to Grimoire",
                filter: {
                    every: [
                        { key: ["metadata", `${itemMetadataKey}`], value: undefined, coordinator: "||" },
                        {
                            key: ["metadata", `${itemMetadataKey}`, "hpTrackerActive"],
                            value: false,
                        },
                        { key: "type", value: "IMAGE", coordinator: "&&" },
                        { key: "layer", value: "PROP" },
                    ],
                    roles: ["GM"],
                },
            },
        ],
        onClick: async (context) => {
            const contextItems = context.items.filter((i) => i.layer === "PROP" && i.type === "IMAGE");

            const tokenIds = await prepareTokenForGrimoire(contextItems as Array<Image>);
            const tokens = await OBR.scene.items.getItems(tokenIds);
            tokens.forEach((token) => {
                if (itemMetadataKey in token.metadata) {
                    const metadata = token.metadata[itemMetadataKey] as GMGMetadata;
                    updateHp(token, metadata);
                    updateAc(token, metadata);
                }
            });
        },
    });

    await OBR.contextMenu.create({
        id: `${ID}/gmg-end-turn`,
        icons: [
            {
                icon: "/icon.svg",
                label: "End Turn",
                filter: {
                    every: [
                        { key: ["metadata", `${itemMetadataKey}`, "hpTrackerActive"], value: true, coordinator: "&&" },
                        { key: ["metadata", `${itemMetadataKey}`, "isCurrent"], value: true, coordinator: "&&" },
                        {
                            key: ["createdUserId"],
                            value: OBR.player.id,
                        },
                    ],
                    roles: ["PLAYER", "GM"],
                },
            },
            {
                icon: "/iconPopover.svg",
                label: "End Turn",
                filter: {
                    every: [
                        { key: ["metadata", `${itemMetadataKey}`, "hp"], value: 0, coordinator: "&&" },
                        { key: ["metadata", `${itemMetadataKey}`, "isCurrent"], value: true },
                    ],
                },
            },
        ],
        onClick: async (context) => {
            const tokens = context.items;
            for (const token of tokens) {
                if (itemMetadataKey in token.metadata) {
                    const metadata = token.metadata[itemMetadataKey] as GMGMetadata;
                    metadata.endRound = true;
                    await updateTokenMetadata(metadata, [token.id]);
                }
            }
        },
    });
};

const initGrimoire = async () => {
    const sceneMetadata = await OBR.scene.getMetadata();
    const roomMetadata = await OBR.room.getMetadata();
    const playerRole = await OBR.player.getRole();

    if (metadataKey in sceneMetadata) {
        const scene = sceneMetadata[metadataKey] as SceneMetadata;
        let ignoreUpdateNotification = false;

        if (metadataKey in roomMetadata) {
            ignoreUpdateNotification = (roomMetadata[metadataKey] as RoomMetadata).ignoreUpdateNotification ?? false;
        }
        if (
            playerRole === "GM" &&
            !ignoreUpdateNotification &&
            scene?.version &&
            compare(scene.version, version, "<")
        ) {
            const width = await OBR.viewport.getWidth();
            await OBR.modal.open({
                ...changelogModal,
                fullScreen: false,
                height: 600,
                width: Math.min(width * 0.9, 600),
            });
        } else if (playerRole === "GM" && scene?.version && compare(scene.version, version, "<")) {
            await OBR.notification.show(`GM's Grimoire has been updated to version ${version}`, "SUCCESS");
        }
        if (scene && scene?.version && compare(scene.version, version, "<")) {
            await updateSceneMetadata(scene, { version: version });
        }
    }
};

const migrations = async () => {
    const metadata = await OBR.scene.getMetadata();
    if (metadataKey in metadata) {
        const data: SceneMetadata = metadata[metadataKey] as SceneMetadata;
        if (data.version) {
            if (compare(data.version, "1.0.3", "<")) {
                await migrate102To103();
            }
            if (compare(data.version, "1.0.6", "<")) {
                await migrate105To106();
            }
            if (compare(data.version, "1.1.2", "<")) {
                await migrate111To112();
            }
            if (compare(data.version, "1.1.3", "<")) {
                await migrate112To113();
            }
            if (compare(data.version, "1.4.0", "<")) {
                await migrateTo140();
            }
            if (compare(data.version, "1.4.1", "<")) {
                await migrateTo141();
            }
            if (compare(data.version, "1.6.0", "<")) {
                await migrateTo160();
            }
            if (compare(data.version, "2.0.0", "<")) {
                await migrateTo200();
            }
            if (compare(data.version, "3.0.0", "<")) {
                await migrateTo300();
            }
            if (compare(data.version, "3.5.0", "<")) {
                await migrateTo350();
            }
        }
    }
};

const sceneReady = async () => {
    try {
        await initGrimoire();
    } catch (e) {
        console.warn("GM's Grimoire - Error while initializing Grimoire", e);
    }
    try {
        await migrations();
    } catch (e) {
        console.warn("GM's Grimoire - Error while running migrations", e);
    }
    try {
        await initItems();
    } catch (e) {
        console.warn("GM's Grimoire - Error while initializing items", e);
    }
    try {
        await initScene();
    } catch (e) {
        console.warn("GM's Grimoire - Error while initializing Scene", e);
    }
};

const initTokens = async () => {
    // Triggers everytime any item is changed
    OBR.scene.items.onChange(async (items) => {
        const tokens = items.filter((item) => {
            return itemMetadataKey in item.metadata && (item.metadata[itemMetadataKey] as GMGMetadata).hpTrackerActive;
        });
        await updateTextVisibility(tokens);
        await updateAcVisibility(tokens);
    });
};

const initMessageBus = async () => {
    OBR.broadcast.onMessage(nextTurnChannel, (event) => {
        const data = event.data as { name: string; playerId: string };
        if (data.playerId === OBR.player.id) {
            OBR.notification.show(`Heads up ${data.name}! You're next in initiative!`, "WARNING");
        }
    });
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

const initPlayerParty = async () => {
    const room = await OBR.room.getMetadata();
    const addParty = partyStore.getState().addParty;
    if (metadataKey in room) {
        const roomMetadata = room[metadataKey] as RoomMetadata;
        const apiKey = roomMetadata.tabletopAlmanacAPIKey;
        if (apiKey) {
            try {
                const partQuery = await listParties({ params: { limit: 100, offset: 0 }, token: apiKey });
                const parties = partQuery.data as PartyPagination;
                parties.page.forEach((party) => {
                    addParty(party);
                });
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

const initParty = async () => {
    OBR.scene.onMetadataChange((metadata) => {
        const party = partyStore.getState().currentParty;
        const scene = metadata[metadataKey] as SceneMetadata;
        if (party && scene?.groups && party.group && !scene.groups.includes(party.group)) {
            updateSceneMetadata(scene, { groups: [...scene.groups, party.group] });
        }
    });

    // subscribe to party changes
    OBR.room.onMetadataChange((metadata) => {
        const room = useMetadataContext.getState().room;
        const gmgMetadata = metadata[metadataKey] as RoomMetadata;
        if (!_.isEqual(room, gmgMetadata) && gmgMetadata.partyId) {
            partyStore.getState().setCurrentParty(gmgMetadata.partyId);
        }
    });

    // subscribe to token changes
    OBR.scene.items.onChange((items) => {
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
                                    if (itemMetadataKey in member.metadata) {
                                        const data = member.metadata[itemMetadataKey] as GMGMetadata;
                                        member.metadata[itemMetadataKey] = { ...data, group: currentParty?.group };
                                    }
                                    i.metadata = member.metadata;
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

OBR.onReady(async () => {
    console.info(`GM's Grimoire - version ${version} initializing`);
    try {
        await setupContextMenu();
    } catch (e) {
        console.warn("GM's Grimoire - error while setting up context menu");
    }
    try {
        await initMessageBus();
    } catch (e) {
        console.warn("GM's Grimoire - error while setting up message bus");
    }

    if ((await OBR.player.getRole()) === "GM") {
        try {
            await initRoom();
        } catch (e) {
            console.warn("GM's Grimoire - Error while initializing Room", e);
        }

        OBR.scene.onReadyChange(async (isReady) => {
            if (isReady) {
                await sceneReady();
            }
        });

        const isReady = await OBR.scene.isReady();
        if (isReady) {
            await sceneReady();
        }

        try {
            await initTokens();
        } catch (e) {
            console.warn("GM's Grimoire - error while initializing Token event handler", e);
        }

        try {
            await initParty();
        } catch (e) {
            console.warn("GM's Grimoire - error while initializing Token event handler", e);
        }
    } else {
        try {
            await initPlayerParty();
        } catch (e) {
            console.warn("GM's Grimoire - error while initializing Player Party", e);
        }
    }
    try {
        await setupDddice();
        await setupDicePlus();
        await registerMessageHandlers();
    } catch (e) {
        await OBR.notification.show(
            "GM's Grimoire dice roller initialization error. Check browser logs for more info.",
            "ERROR",
        );
        console.warn("GM's Grimoire - error while intializing diceroller", e);
    }
    console.info(`GM's Grimoire - initialization done`);
});
