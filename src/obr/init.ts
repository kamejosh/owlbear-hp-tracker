import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { ID, characterMetadata, sceneMetadata, version } from "../helper/variables.ts";
import { migrate102To103 } from "../migrations/v103.ts";
import { migrate105To106 } from "../migrations/v106.ts";
import { compare } from "compare-versions";
import { HpTrackerMetadata, SceneMetadata } from "../helper/types.ts";
import { migrate111To112 } from "../migrations/v112.ts";
import { migrate112To113 } from "../migrations/v113.ts";
import { updateHp, updateTextVisibility } from "../helper/hpHelpers.ts";
import { v4 as uuidv4 } from "uuid";
import { migrateTo140 } from "../migrations/v140.ts";
import { updateAc, updateAcVisibility } from "../helper/acHelper.ts";
import { migrateTo141 } from "../migrations/v141.ts";

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
                    stats: { initiativeBonus: 0 },
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
            acOffset: { x: 0, y: 0 },
            acShield: true,
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
        if (!sceneData.acOffset) {
            sceneData.acOffset = { x: 0, y: 0 };
        }
        if (!sceneData.acShield) {
            sceneData.acShield = true;
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
                label: "HP Tracker",
                filter: {
                    every: [{ key: ["metadata", `${characterMetadata}`, "hpTrackerActive"], value: true }],
                    roles: ["GM"],
                },
            },
        ],
        embed: {
            url: "/popover.html",
            height: 90,
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
                            updateHp(item, { ...metadata });
                            updateAc(item, { ...metadata });
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
                                stats: {
                                    initiativeBonus: 0,
                                },
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
        if (compare(data.version, "1.4.1", "<")) {
            await migrateTo141();
        }
    }
};

const sceneReady = async () => {
    await migrations();
    await initItems();
    await initScene();
};

const initTokens = async () => {
    // Triggers everytime any item is changed
    OBR.scene.items.onChange(async (items) => {
        const tokens = items.filter((item) => {
            return (
                characterMetadata in item.metadata &&
                (item.metadata[characterMetadata] as HpTrackerMetadata).hpTrackerActive
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
