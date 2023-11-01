import OBR, { Item, Text, Metadata } from "@owlbear-rodeo/sdk";
import { ID, characterMetadata, sceneMetadata, version } from "../helper/variables.ts";
import { migrate102To103 } from "../migrations/v103.ts";
import { migrate105To106 } from "../migrations/v106.ts";
import { compare } from "compare-versions";
import { HpTrackerMetadata, SceneMetadata, TextItemChanges } from "../helper/types.ts";
import { migrate111To112 } from "../migrations/v112.ts";
import { migrate112To113 } from "../migrations/v113.ts";
import { updateHpBar } from "../helper/shapeHelpers.ts";
import { handleTextVisibility, updateText, updateTextChanges } from "../helper/textHelpers.ts";
import { getAttachedItems } from "../helper/helpers.ts";
import { v4 as uuidv4 } from "uuid";
import { migrateTo140 } from "../migrations/v140.ts";

/**
 * All character items get the default values for the HpTrackeMetadata.
 * This ensures that further handling can be done properly
 */
const initItems = async () => {
    const addMetaData = (items: Item[]) => {
        items.forEach((item) => {
            if (!(characterMetadata in item.metadata)) {
                // initializing a variable gives us type safety
                const initialMetadata: HpTrackerMetadata = {
                    name: item.name,
                    hp: 0,
                    maxHp: 0,
                    armorClass: 0,
                    hpTrackerActive: false,
                    canPlayersSee: false,
                    hpOnMap: false,
                    acOnMap: false,
                    hpBar: false,
                    initiative: 0,
                    sheet: "",
                };
                item.metadata[characterMetadata] = initialMetadata;
            }
        });
    };

    await OBR.scene.items.updateItems((item) => item.layer === "CHARACTER" || item.layer === "MOUNT", addMetaData);
};

const initScene = async () => {
    const metadata: Metadata = await OBR.scene.getMetadata();
    const ownMetadata: Metadata = {};
    if (!(sceneMetadata in metadata)) {
        ownMetadata[sceneMetadata] = {
            version: version,
            hpBarSegments: 0,
            hpBarOffset: 0,
            allowNegativNumbers: false,
            id: uuidv4(),
            groups: ["Default"],
        };
    } else {
        const sceneData = metadata[sceneMetadata] as SceneMetadata;
        sceneData.version = version;

        if (!sceneData.id) {
            sceneData.id = uuidv4();
        }
        if (typeof sceneData.groups === "string") {
            // @ts-ignore there might be some legacy issue where groups is still a string
            sceneData.groups = sceneData.groups.split(" ");
        }
        if (!sceneData.groups || sceneData.groups.length === 0) {
            sceneData.groups = ["Default"];
        }
        if (sceneData.hpBarSegments === undefined) {
            sceneData.hpBarSegments = 0;
        }
        if (sceneData.hpBarOffset === undefined) {
            sceneData.hpBarOffset = 0;
        }
        if (sceneData.allowNegativeNumbers === undefined) {
            sceneData.allowNegativeNumbers = false;
        }
        // @ts-ignore some beta version startet with using 5e
        if (sceneData.ruleset === "5e") {
            sceneData.ruleset = "e5";
        }
        // @ts-ignore some beta version startet with using pf2e
        if (sceneData.ruleset === "pf2e") {
            sceneData.ruleset = "pf";
        }
        ownMetadata[sceneMetadata] = sceneData;
    }
    await OBR.scene.setMetadata(ownMetadata);
};

const setupContextMenu = async () => {
    await OBR.contextMenu.create({
        id: `${ID}/popover`,
        icons: [
            {
                icon: "/iconPopover.svg",
                label: "HP Tracker Popover",
                filter: {
                    every: [{ key: ["metadata", `${characterMetadata}`, "hpTrackerActive"], value: true }],
                    roles: ["GM"],
                },
            },
        ],
        onClick: (context, elementId) => {
            OBR.popover.open({
                id: `${ID}/popover`,
                url: `/popover.html?id=${context.items[0].id}`,
                height: 40,
                width: 490,
                anchorElementId: elementId,
            });
        },
    });

    await OBR.contextMenu.create({
        id: `${ID}/popoverPlayer`,
        icons: [
            {
                icon: "/iconPopover.svg",
                label: "HP Tracker Popover",
                filter: {
                    every: [
                        { key: ["metadata", `${characterMetadata}`, "hpTrackerActive"], value: true },
                        {
                            key: ["metadata", `${characterMetadata}`, "canPlayersSee"],
                            value: true,
                            coordinator: "&&",
                        },
                    ],
                    roles: ["PLAYER"],
                },
            },
        ],
        onClick: (context, elementId) => {
            OBR.popover.open({
                id: `${ID}/popover`,
                url: `/popover.html?id=${context.items[0].id}`,
                height: 40,
                width: 300,
                anchorElementId: elementId,
            });
        },
    });

    await OBR.contextMenu.create({
        id: `${ID}/tool`,
        icons: [
            {
                icon: "/icon.svg",
                label: "Activate HP Tracker",
                filter: {
                    every: [{ key: "type", value: "IMAGE" }],
                    some: [
                        { key: ["metadata", `${characterMetadata}`], value: undefined, coordinator: "||" },
                        {
                            key: ["metadata", `${characterMetadata}`, "hpTrackerActive"],
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
                    every: [{ key: ["metadata", `${characterMetadata}`, "hpTrackerActive"], value: true }],
                    roles: ["GM"],
                },
            },
        ],
        onClick: (context) => {
            const initTokens = async () => {
                OBR.scene.items.updateItems(context.items, (items) => {
                    items.forEach((item) => {
                        if (characterMetadata in item.metadata) {
                            const metadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                            updateText(
                                (metadata.hpOnMap || metadata.acOnMap) && !metadata.hpTrackerActive,
                                metadata.canPlayersSee && item.visible,
                                item.id,
                                { ...metadata }
                            );
                            updateHpBar(metadata.hpBar && !metadata.hpTrackerActive, item.id, { ...metadata });
                            metadata.hpTrackerActive = !metadata.hpTrackerActive;
                            item.metadata[characterMetadata] = metadata;
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
                            };
                            item.metadata[characterMetadata] = defaultMetadata;
                        }
                    });
                });
            };
            initTokens();
        },
    });
};

const migrations = async () => {
    const metadata = await OBR.scene.getMetadata();
    if (sceneMetadata in metadata) {
        const data: SceneMetadata = metadata[sceneMetadata] as SceneMetadata;
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
    }
};

const sceneReady = async () => {
    await migrations();
    await initItems();
    await initScene();
};

const registerEvents = () => {
    // Triggers everytime any item is changed
    OBR.scene.items.onChange(async (items) => {
        const changeMap = new Map<string, TextItemChanges>();
        const tokens = items.filter((item) => characterMetadata in item.metadata);
        for (const token of tokens) {
            const texts = await getAttachedItems(token.id, "TEXT");
            await handleTextVisibility(token, texts as Array<Text>, changeMap);
        }
        await updateTextChanges(changeMap);
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

    registerEvents();
});
