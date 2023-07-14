import { createText, getAttachedTextItem, localItemsCache } from "./helpers.ts";
import { characterMetadata, textMetadata } from "./variables.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { Changes, HpTrackerMetadata, TextItemChanges } from "./types.ts";

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
                change.text = `HP:${data.hp}/${data.maxHp}`;
                changeMap.set(attachment.id, change);
            }
        });
    } else {
        const text = await createText(`HP:${data.hp}/${data.maxHp}`, character.id ?? "");
        if (text) {
            await OBR.scene.local.addItems([text]);
            localItemsCache.invalid = true;
        }
    }
};

export const deleteText = async (attachments: Item[]) => {
    if (attachments.length > 0) {
        await OBR.scene.local.deleteItems(attachments.map((attachment) => attachment.id));
        localItemsCache.invalid = true;
    }
};

export const handleOtherChanges = async (
    character: Item,
    attachments: Item[],
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
                    character.position.x - 150 != attachment.position.x ||
                    character.position.y + 70 != attachment.position.y
                ) {
                    change.position = { x: character.position.x - 150, y: character.position.y + 70 };
                }
                changeMap.set(attachment.id, change);
            }
        });
    }
};

export const prepareTextChanges = async (characters: Item[], role: "GM" | "PLAYER") => {
    const changes: Changes = { textItems: new Map<string, TextItemChanges>() };
    for (const character of characters) {
        if (characterMetadata in character.metadata) {
            const attachments = await getAttachedTextItem(character.id);
            const data = character.metadata[characterMetadata] as HpTrackerMetadata;
            if (data.hpOnMap && (role === "GM" || (role === "PLAYER" && data.canPlayersSee))) {
                await saveOrChangeText(character, data, attachments, changes.textItems);
                await handleOtherChanges(character, attachments, changes.textItems);
            } else {
                await deleteText(attachments);
            }
        }
    }
    return changes;
};
