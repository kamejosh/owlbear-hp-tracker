import OBR, { isText, Item } from "@owlbear-rodeo/sdk";
import { ID, characterMetadata } from "../helper/variables.ts";
import { prepareTextChanges } from "../helper/textHelpers.ts";
import { migrate102To103 } from "../migrations/v103.ts";

/**
 * All character items get the default values for the HpTrackeMetadata.
 * This ensures that further handling can be done properly
 */
const initItems = async () => {
    const addMetaData = (items: Item[]) => {
        items.forEach((item) => {
            if (!(characterMetadata in item.metadata)) {
                item.metadata[characterMetadata] = {
                    name: "",
                    hp: 0,
                    maxHp: 0,
                    armorClass: 0,
                    hpTrackerActive: false,
                    canPlayersSee: false,
                    hpOnMap: false,
                };
            }
        });
    };

    await OBR.scene.items.updateItems((item) => item.layer === "CHARACTER", addMetaData);
};

/**
 * The Texts that display the current HP of a Character Item must be updated anytime the metadata of the Character Items
 * is changed.
 *
 */
const initTexts = async () => {
    const role = await OBR.player.getRole();
    // Triggers everytime any item is changed
    OBR.scene.items.onChange(async (items) => {
        // But we only care about Character Items
        const characters = items.filter((item) => item.layer === "CHARACTER");
        const changes = await prepareTextChanges(characters, role);

        if (changes.textItems.size > 0) {
            await OBR.scene.local.updateItems(isText, (texts) => {
                texts.forEach((text) => {
                    if (changes.textItems.has(text.id)) {
                        const change = changes.textItems.get(text.id);
                        if (change) {
                            if (change.text) {
                                text.text.plainText = change.text;
                            }
                            if (change.visible) {
                                text.visible = change.visible;
                            }
                            if (change.position) {
                                text.position = change.position;
                            }
                        }
                    }
                });
            });
        }
    });
};

const setupContextMenu = async () => {
    return OBR.contextMenu.create({
        id: `${ID}/tool`,
        icons: [
            {
                icon: "/icon.svg",
                label: "HP Tracker",
                filter: {
                    every: [{ key: "layer", value: "CHARACTER" }],
                    roles: ["GM"],
                },
            },
        ],
        onClick: (context, elementId) => {
            OBR.popover.open({
                id: `${ID}/popover`,
                url: `/popover.html?id=${context.items[0].id}`,
                height: 140,
                width: 600,
                anchorElementId: elementId,
            });
        },
    });
};

const migrations = async () => {
    await migrate102To103();
};

OBR.onReady(async () => {
    setupContextMenu();
    initTexts();
    OBR.scene.onReadyChange(async (isReady) => {
        if (isReady) {
            migrations();
            initItems();
        }
    });
});
