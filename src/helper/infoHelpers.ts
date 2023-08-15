import {
    calculatePercentage,
    createShape,
    createText,
    getAttachedItems,
    getAttachedLocalItems,
    getImageBounds,
    itemsCache,
    localItemsCache,
} from "./helpers.ts";
import { characterMetadata, infoMetadata, sceneMetadata } from "./variables.ts";
import OBR, { Item, Shape, Image, Metadata, Text } from "@owlbear-rodeo/sdk";
import { Changes, HpTrackerMetadata, SceneMetadata, ShapeItemChanges, TextItemChanges } from "./types.ts";

export const saveOrChangeShape = async (
    character: Item,
    data: HpTrackerMetadata,
    attachments: Item[],
    changeMap: Map<string, ShapeItemChanges>
) => {
    // const bounds = await OBR.scene.items.getItemBounds([character.id]);
    const dpi = await OBR.scene.grid.getDpi();
    const bounds = getImageBounds(character as Image, dpi);
    const width = bounds.width;

    const handleAttachment = async (attachment: Item) => {
        const shape = attachment as Shape;
        if (attachment.name === "hp" && infoMetadata in attachment.metadata) {
            const change = changeMap.get(attachment.id) ?? {};
            const percentage = await calculatePercentage(data);
            if (percentage === 0) {
                change.color = "black";
            } else {
                change.color = "red";
            }
            change.width = percentage === 0 ? 0 : (width - 4) * percentage;
            if (shape.width != change.width || shape.style.fillColor != change.color) {
                changeMap.set(attachment.id, change);
            }
        } else if (infoMetadata in attachment.metadata) {
            const change = changeMap.get(attachment.id) ?? {};
            if (shape.width != width) {
                change.width = width;
                changeMap.set(attachment.id, change);
            }
        }
    };

    if (attachments.length > 0) {
        attachments.forEach(handleAttachment);
    } else {
        const percentage = await calculatePercentage(data);
        const shapes = await createShape(percentage, character.id);
        if (shapes) {
            itemsCache.invalid = true;
            await OBR.scene.items.addItems(shapes);
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
            if (infoMetadata in attachment.metadata) {
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
            itemsCache.invalid = true;
            await OBR.scene.local.addItems([text]);
        }
    }
};

export const deleteAttachments = async (attachments: Item[]) => {
    if (attachments.length > 0) {
        itemsCache.invalid = true;
        await OBR.scene.items.deleteItems(attachments.map((attachment) => attachment.id));
    }
};

export const deleteLocalAttachments = async (attachments: Item[]) => {
    if (attachments.length > 0) {
        localItemsCache.invalid = true;
        await OBR.scene.local.deleteItems(attachments.map((attachment) => attachment.id));
    }
};

export const handleOtherTextChanges = async (
    character: Item,
    attachments: Text[],
    changeMap: Map<string, TextItemChanges>
) => {
    if (attachments.length > 0) {
        // const bounds = await OBR.scene.items.getItemBounds([character.id]);
        const dpi = await OBR.scene.grid.getDpi();
        const bounds = getImageBounds(character as Image, dpi);
        const height = bounds.height / 2;
        let offset = (((await OBR.scene.getMetadata()) as Metadata)[sceneMetadata] as SceneMetadata).hpBarOffset ?? 0;
        const offsetFactor = bounds.height / 150;
        offset *= offsetFactor;
        attachments.forEach((attachment) => {
            if (infoMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};
                if (character.visible !== attachment.visible) {
                    change.visible = character.visible;
                }
                if (
                    character.position.x - Number(attachment.text.width) / 2 != attachment.position.x ||
                    character.position.y + height - 47 + offset != attachment.position.y
                ) {
                    change.position = {
                        x: character.position.x - Number(attachment.text.width) / 2,
                        y: character.position.y + height - 47 + offset,
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
            const textAttachments = await getAttachedLocalItems(character.id, "TEXT");
            const shapeAttachments = await getAttachedItems(character.id, "SHAPE");
            const data = character.metadata[characterMetadata] as HpTrackerMetadata;

            if (!data.hpTrackerActive) {
                await deleteLocalAttachments(textAttachments);
                await deleteAttachments(shapeAttachments);
            } else {
                if ((!data.hpOnMap && !data.acOnMap) || (role === "PLAYER" && !data.canPlayersSee)) {
                    await deleteLocalAttachments(textAttachments);
                } else {
                    await saveOrChangeText(character, data, textAttachments, changes.textItems);
                    await handleOtherTextChanges(character, textAttachments as Text[], changes.textItems);
                }

                if (!data.hpBar) {
                    await deleteAttachments(shapeAttachments);
                } else {
                    await saveOrChangeShape(character, data, shapeAttachments, changes.shapeItems);
                }
            }
        }
    }
    return changes;
};
