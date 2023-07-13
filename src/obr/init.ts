import OBR, { Item } from "@owlbear-rodeo/sdk";
import { ID, characterMetadata } from "../helper/variables.ts";
import { HpTrackerMetadata } from "../helper/types.ts";
import { deleteText, handleOtherChanges, saveOrChangeText } from "../helper/textHelpers.ts";

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
    OBR.scene.items.onChange((items) => {
        // But we only care about Character Items
        const characters = items.filter((item) => item.layer === "CHARACTER");
        characters.forEach(async (character) => {
            // Specifically on character items with the characterMetadata
            if (characterMetadata in character.metadata) {
                const data = character.metadata[characterMetadata] as HpTrackerMetadata;
                // Even more specifically where the metadata `hpOnMap` is not an empty string
                if (data.hpOnMap && (role === "GM" || (role === "PLAYER" && data.canPlayersSee))) {
                    saveOrChangeText(character, data);
                    handleOtherChanges(character);
                } else {
                    deleteText(character);
                }
            }
        });
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

OBR.onReady(async () => {
    setupContextMenu();
    initTexts();
    OBR.scene.onReadyChange(async (isReady) => {
        if (isReady) {
            initItems();
        }
    });
});
