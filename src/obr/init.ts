import OBR, { isText, Item } from "@owlbear-rodeo/sdk";
import { ID, characterMetadata, textMetadata } from "../helper/variables.ts";
import { HpTextMetadata, HpTrackerMetadata } from "../helper/types.ts";

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
                    hpTrackerActive: false,
                    canPlayersSee: false,
                    hpOnMap: "",
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
                if (data.hpOnMap) {
                    // For these characters we than need the attachments
                    const attachments = await OBR.scene.items.getItemAttachments([character.id]);
                    attachments.forEach((attachment) => {
                        // But only the attachments with textMetadata
                        if (textMetadata in attachment.metadata) {
                            const attachmentData = attachment.metadata[textMetadata] as HpTextMetadata;
                            // Specifically where the `isHpText` metadata is true
                            if (attachmentData.isHpText) {
                                // We then update all items that are isText
                                OBR.scene.items.updateItems(isText, (texts) => {
                                    texts.forEach((text) => {
                                        // But set a filter that only changes the element if it is the same as the attachment
                                        if (text.id === attachment.id) {
                                            // We update the text
                                            text.text.plainText = `HP:${data.hp}/${data.maxHp}`;
                                            // and make sure that it is only visible for GMs or players if the flag is set
                                            if (role === "PLAYER" && !data.canPlayersSee) {
                                                text.visible = false;
                                            }
                                        }
                                    });
                                });
                            }
                        }
                    });
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
    OBR.scene.onReadyChange((isReady) => {
        console.log(isReady);
        if (isReady) {
            initItems();
        }
    });
});
