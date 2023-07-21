import { createShape, createText, getAttachedItems, localItemsCache } from "./helpers.ts";
import { characterMetadata, textMetadata } from "./variables.ts";
import OBR, { Item, Text, Shape } from "@owlbear-rodeo/sdk";
import { Changes, HpTrackerMetadata, ShapeItemChanges, TextItemChanges } from "./types.ts";

export const saveOrChangeShape = async (
    character: Item,
    data: HpTrackerMetadata,
    attachments: Item[],
    changeMap: Map<string, ShapeItemChanges>
) => {
    const width = 200;
    if (attachments.length > 0) {
        attachments.forEach((attachment) => {
            if (attachment.name === "name" && textMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};
                change.width = (width * data.hp) / data.maxHp - 4;
                changeMap.set(attachment.id, change);
            }
        });
    } else {
        const percentage = data.hp === 0 && data.maxHp === 0 ? 0 : data.hp / data.maxHp;
        const shapes = await createShape(percentage, character.id);
        console.log(shapes, character.id);
        if (shapes) {
            await OBR.scene.local.addItems(shapes);
            localItemsCache.invalid = true;
        }
    }
};

export const saveOrChangeText = async (
    character: Item,
    data: HpTrackerMetadata,
    attachments: Item[],
    changeMap: Map<string, TextItemChanges>
) => {
    if (attachments.length > 0) {
        attachments.forEach((attachment) => {
            if (textMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};

                const text =
                    (data.hpOnMap ? `HP:${data.hp}/${data.maxHp}` : "") +
                    (data.hpOnMap && data.acOnMap ? " " : "") +
                    (data.acOnMap ? `AC:${data.armorClass}` : "");
                change.text = text;
                changeMap.set(attachment.id, change);
            }
        });
    } else {
        const textContent =
            (data.hpOnMap ? `HP:${data.hp}/${data.maxHp}` : "") +
            (data.hpOnMap && data.acOnMap ? " " : "") +
            (data.acOnMap ? `AC:${data.armorClass}` : "");
        const text = await createText(textContent, character.id ?? "");
        if (text) {
            await OBR.scene.local.addItems([text]);
            localItemsCache.invalid = true;
        }
    }
};

export const deleteAttachments = async (attachments: Item[]) => {
    if (attachments.length > 0) {
        await OBR.scene.local.deleteItems(attachments.map((attachment) => attachment.id));
        localItemsCache.invalid = true;
    }
};

export const handleOtherTextChanges = async (
    character: Item,
    attachments: Text[],
    changeMap: Map<string, TextItemChanges>
) => {
    if (attachments.length > 0) {
        attachments.forEach((attachment) => {
            if (textMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};
                if (character.visible !== attachment.visible) {
                    change.visible = character.visible;
                }
                if (
                    character.position.x - Number(attachment.text.width) / 2 != attachment.position.x ||
                    character.position.y + 10 != attachment.position.y
                ) {
                    change.position = {
                        x: character.position.x - Number(attachment.text.width) / 2,
                        y: character.position.y + 10,
                    };
                }
                changeMap.set(attachment.id, change);
            }
        });
    }
};

export const handleOtherShapeChanges = async (
    character: Item,
    attachments: Shape[],
    changeMap: Map<string, ShapeItemChanges>
) => {
    if (attachments.length > 0) {
        attachments.forEach((attachment) => {
            if (textMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};
                if (character.visible !== attachment.visible) {
                    change.visible = character.visible;
                }
                if (
                    character.position.x - Number(attachment.text.width) / 2 != attachment.position.x ||
                    character.position.y + 10 != attachment.position.y
                ) {
                    change.position = {
                        x: character.position.x - Number(attachment.text.width) / 2,
                        y: character.position.y + 10,
                    };
                }
                changeMap.set(attachment.id, change);
            }
        });
    }
};

export const prepareDisplayChanges = async (characters: Item[], role: "GM" | "PLAYER") => {
    const changes: Changes = {
        textItems: new Map<string, TextItemChanges>(),
        shapeItems: new Map<string, ShapeItemChanges>(),
    };
    for (const character of characters) {
        if (characterMetadata in character.metadata) {
            const textAttachments = await getAttachedItems(character.id, "TEXT");
            const shapeAttachments = await getAttachedItems(character.id, "SHAPE");
            const data = character.metadata[characterMetadata] as HpTrackerMetadata;

            if (!data.hpOnMap && data.hpMode === "NUM" && !data.acOnMap) {
                await deleteAttachments(textAttachments.concat(shapeAttachments));
            } else {
                if (!data.hpOnMap && !data.acOnMap) {
                    await deleteAttachments(textAttachments);
                }
                if (data.hpMode === "NUM") {
                    await deleteAttachments(shapeAttachments);
                }
            }

            if (data.hpMode === "BAR") {
                await saveOrChangeShape(character, data, shapeAttachments, changes.shapeItems);
            }

            if (role === "GM" || (role === "PLAYER" && data.canPlayersSee)) {
                await saveOrChangeText(character, data, textAttachments, changes.textItems);
                await handleOtherTextChanges(character, textAttachments as Array<Text>, changes.textItems);
            } else {
                await deleteAttachments(textAttachments);
            }
        }
    }
    return changes;
};
