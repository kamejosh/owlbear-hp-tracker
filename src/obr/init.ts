import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { ID, itemMetadataKey, metadataKey, version } from "../helper/variables.ts";
import { migrate102To103 } from "../migrations/v103.ts";
import { migrate105To106 } from "../migrations/v106.ts";
import { compare } from "compare-versions";
import {
    ACItemChanges,
    BarItemChanges,
    HpTrackerMetadata,
    RoomMetadata,
    SceneMetadata,
    TextItemChanges,
} from "../helper/types.ts";
import { migrate111To112 } from "../migrations/v112.ts";
import { migrate112To113 } from "../migrations/v113.ts";
import {
    saveOrChangeBar,
    saveOrChangeText,
    updateBarChanges,
    updateHp,
    updateTextChanges,
    updateTextVisibility,
} from "../helper/hpHelpers.ts";
import { v4 as uuidv4 } from "uuid";
import { migrateTo140 } from "../migrations/v140.ts";
import { saveOrChangeAC, updateAc, updateAcChanges, updateAcVisibility } from "../helper/acHelper.ts";
import { migrateTo141 } from "../migrations/v141.ts";
import { attachmentFilter, getAttachedItems } from "../helper/helpers.ts";
import { migrateTo160 } from "../migrations/v160.ts";

/**
 * All character items get the default values for the HpTrackeMetadata.
 * This ensures that further handling can be done properly
 */
const initItems = async () => {
    const tokens = await OBR.scene.items.getItems(
        (item) =>
            itemMetadataKey in item.metadata && (item.metadata[itemMetadataKey] as HpTrackerMetadata).hpTrackerActive
    );

    const barChanges = new Map<string, BarItemChanges>();
    const textChanges = new Map<string, TextItemChanges>();
    const acChanges = new Map<string, ACItemChanges>();

    for (const token of tokens) {
        const data = token.metadata[itemMetadataKey] as HpTrackerMetadata;
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
            await saveOrChangeAC(token, data, acAttachments, acChanges, token.visible && data.canPlayersSee);
        }
    }

    await updateAcChanges(acChanges);
    await updateBarChanges(barChanges);
    await updateTextChanges(textChanges);
    console.log("HP Tracker - Token initialization done");
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
            playerSort: false,
            statblockPopover: { width: 500, height: 600 },
            initiativeDice: 20,
            ruleset: "e5",
            ignoreUpdateNotification: false,
            diceRendering: true,
        };
        ownMetadata[metadataKey] = roomData;
    } else {
        const roomData = metadata[metadataKey] as RoomMetadata;
        if (roomData.ruleset !== "pf" && roomData.ruleset !== "e5") {
            roomData.ruleset = "e5";
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
        };

        ownMetadata[metadataKey] = sceneData;
    } else {
        const sceneData = metadata[metadataKey] as SceneMetadata;
        sceneData.version = version;

        if (!sceneData.id) {
            sceneData.id = uuidv4();
        }
        if (!sceneData.groups || sceneData.groups.length === 0) {
            sceneData.groups = ["Default"];
        }
        if (sceneData.openGroups === undefined) {
            sceneData.openGroups = ["Default"];
        }

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
                label: "HP Tracker",
                filter: {
                    every: [{ key: ["metadata", `${itemMetadataKey}`, "hpTrackerActive"], value: true }],
                    roles: ["GM"],
                },
            },
        ],
        embed: {
            url: "/popover.html",
            height: 100,
        },
    });

    await OBR.contextMenu.create({
        id: `${ID}/popoverPlayer`,
        icons: [
            {
                icon: "/iconPopover.svg",
                label: "HP Tracker",
                filter: {
                    every: [
                        { key: ["metadata", `${itemMetadataKey}`, "hpTrackerActive"], value: true },
                        {
                            key: ["metadata", `${itemMetadataKey}`, "canPlayersSee"],
                            value: true,
                            coordinator: "&&",
                        },
                    ],
                    roles: ["PLAYER"],
                },
            },
        ],
        embed: {
            url: "/popover.html",
            height: 90,
        },
    });

    await OBR.contextMenu.create({
        id: `${ID}/tool`,
        icons: [
            {
                icon: "/icon.svg",
                label: "Activate HP Tracker",
                filter: {
                    every: [
                        { key: "type", value: "IMAGE", coordinator: "||" },
                        { key: "type", value: "SHAPE" },
                    ],
                    some: [
                        { key: ["metadata", `${itemMetadataKey}`], value: undefined, coordinator: "||" },
                        {
                            key: ["metadata", `${itemMetadataKey}`, "hpTrackerActive"],
                            value: false,
                        },
                    ],
                    roles: ["GM"],
                },
            },
            {
                icon: "/iconOff.svg",
                label: "Deactivate HP Tracker",
                filter: {
                    every: [{ key: ["metadata", `${itemMetadataKey}`, "hpTrackerActive"], value: true }],
                    roles: ["GM"],
                },
            },
        ],
        onClick: async (context) => {
            const tokenIds: Array<string> = [];
            const initTokens = async () => {
                await OBR.scene.items.updateItems(context.items, (items) => {
                    items.forEach((item) => {
                        tokenIds.push(item.id);
                        if (itemMetadataKey in item.metadata) {
                            const metadata = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                            metadata.hpTrackerActive = !metadata.hpTrackerActive;
                            item.metadata[itemMetadataKey] = metadata;
                        } else {
                            // variable allows us to be typesafe
                            const defaultMetadata: HpTrackerMetadata = {
                                name: item.name,
                                hp: 0,
                                maxHp: 0,
                                armorClass: 0,
                                hpTrackerActive: true,
                                canPlayersSee: false,
                                hpOnMap: false,
                                acOnMap: false,
                                hpBar: false,
                                initiative: 0,
                                sheet: "",
                                stats: {
                                    initiativeBonus: 0,
                                },
                            };
                            item.metadata[itemMetadataKey] = defaultMetadata;
                        }
                    });
                });
            };

            await initTokens();
            const tokens = await OBR.scene.items.getItems(tokenIds);
            tokens.forEach((token) => {
                if (itemMetadataKey in token.metadata) {
                    const metadata = token.metadata[itemMetadataKey] as HpTrackerMetadata;
                    updateHp(token, metadata);
                    updateAc(token, metadata);
                }
            });
        },
    });
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
        }
    }
};

const sceneReady = async () => {
    await migrations();
    await initItems();
    await initRoom();
    await initScene();
};

const initTokens = async () => {
    // Triggers everytime any item is changed
    OBR.scene.items.onChange(async (items) => {
        const tokens = items.filter((item) => {
            return (
                itemMetadataKey in item.metadata &&
                (item.metadata[itemMetadataKey] as HpTrackerMetadata).hpTrackerActive
            );
        });
        await updateTextVisibility(tokens);
        await updateAcVisibility(tokens);
    });
};

OBR.onReady(async () => {
    console.log(`HP Tracker version ${version} initializing`);
    await setupContextMenu();
    OBR.scene.onReadyChange(async (isReady) => {
        if (isReady) {
            await sceneReady();
        }
    });

    const isReady = await OBR.scene.isReady();
    if (isReady) {
        await sceneReady();
    }

    await initTokens();
});
