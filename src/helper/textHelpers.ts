import { createText, getAttachedTextItem } from "./helpers.ts";
import { textMetadata } from "./variables.ts";
import OBR, { isText, Item, Text } from "@owlbear-rodeo/sdk";
import { HpTrackerMetadata } from "./types.ts";

export const saveOrChangeText = async (character: Item, data: HpTrackerMetadata) => {
    const attachments = await getAttachedTextItem(character.id);

    if (attachments.length > 0) {
        attachments.forEach((attachment) => {
            if (
                textMetadata in attachment.metadata &&
                (attachment as Text).text.plainText !== `HP:${data.hp}/${data.maxHp}`
            ) {
                OBR.scene.local.updateItems(isText, (texts) => {
                    const filteredTexts = texts.filter((text) => text.id === attachment.id);

                    filteredTexts.forEach((text) => {
                        text.text.plainText = `HP:${data.hp}/${data.maxHp}`;
                    });
                });
            }
        });
    } else {
        const text = await createText(`HP:${data.hp}/${data.maxHp}`, character.id ?? "");
        if (text) {
            OBR.scene.local.addItems([text]);
        }
    }
};

export const deleteText = async (character: Item) => {
    const attachments = await getAttachedTextItem(character.id);
    if (attachments.length > 0) {
        OBR.scene.local.deleteItems(attachments.map((attachment) => attachment.id));
    }
};

export const handleOtherChanges = async (character: Item) => {
    const attachments = await getAttachedTextItem(character.id);

    if (attachments.length > 0) {
        attachments.forEach((attachment) => {
            if (textMetadata in attachment.metadata) {
                OBR.scene.local.updateItems(isText, (texts) => {
                    const filteredTexts = texts.filter((text) => text.id === attachment.id);

                    filteredTexts.forEach((text) => {
                        if (character.visible !== attachment.visible) {
                            text.visible = character.visible;
                        }
                        if (
                            character.position.x - 150 != attachment.position.x ||
                            character.position.y + 70 != attachment.position.y
                        ) {
                            text.position = { x: character.position.x - 150, y: character.position.y + 70 };
                        }
                    });
                });
            }
        });
    }
};
