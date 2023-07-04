import "./init.scss";
import OBR, { isText } from "@owlbear-rodeo/sdk";
import { ID, characterMetadata, textMetadata } from "../helper/variables.ts";
import { HpTextMetadata, HpTrackerMetadata } from "../helper/types.ts";

const initItems = async () => {
    return OBR.scene.items.updateItems(
        (item) => item.layer === "CHARACTER",
        (items) => {
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
        }
    );
};

const initTexts = async () => {
    const role = await OBR.player.getRole();
    OBR.scene.items.onChange((items) => {
        const characters = items.filter((item) => item.layer === "CHARACTER");
        characters.forEach(async (character) => {
            if (characterMetadata in character.metadata) {
                const data = character.metadata[characterMetadata] as HpTrackerMetadata;
                if (data.hpOnMap) {
                    const attachments = await OBR.scene.items.getItemAttachments([character.id]);
                    attachments.forEach((attachment) => {
                        if (textMetadata in attachment.metadata) {
                            const attachmentData = attachment.metadata[textMetadata] as HpTextMetadata;
                            if (attachmentData.isHpText) {
                                OBR.scene.items.updateItems(isText, (texts) => {
                                    texts.forEach((text) => {
                                        if (text.id === attachment.id) {
                                            text.text.plainText = `HP:${data.hp}/${data.maxHp}`;
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
                id: "rodeo.owlbear.example/popover",
                url: `/popover.html?id=${context.items[0].id}`,
                height: 140,
                width: 600,
                anchorElementId: elementId,
            });
        },
    });
};

OBR.onReady(async () => {
    initItems();
    setupContextMenu();
    initTexts();
});
