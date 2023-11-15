import { HpTrackerMetadata, ShapeItemChanges, TextItemChanges } from "./types.ts";
import { deleteAttachments, getAttachedItems, getImageBounds, getYOffset } from "./helpers.ts";
import OBR, { buildText, Image, isText, Item, Text } from "@owlbear-rodeo/sdk";
import { characterMetadata, infoMetadata } from "./variables.ts";

export const createText = async (text: string, token: Image) => {
    const width = 400;
    // height is zero, so we're not in the way when trying to move the character icon
    const height = 0;
    const bounds = await getImageBounds(token);
    const position = {
        x: bounds.position.x - width / 2 + bounds.width / 2,
        y: bounds.position.y + bounds.height - 47 + (await getYOffset(bounds.height)),
    };

    const textItem = buildText()
        .text({
            type: "PLAIN",
            plainText: text,
            height: height,
            width: width,
            style: {
                fillColor: "#ffffff",
                fillOpacity: 1,
                strokeColor: "#000000",
                strokeOpacity: 1,
                strokeWidth: 2,
                textAlign: "CENTER",
                textAlignVertical: "TOP",
                fontFamily: "Roboto, sans-serif",
                fontSize: 40,
                fontWeight: 600,
                lineHeight: 1.2,
                padding: 10,
            },
            richText: [],
        })
        .position(position)
        .attachedTo(token.id)
        .layer("TEXT")
        .locked(true)
        .disableAttachmentBehavior(["VISIBLE", "ROTATION"])
        .visible(token.visible)
        .build();

    textItem.metadata[infoMetadata] = { isHpText: true };
    return textItem;
};

const handleTextOffsetUpdate = async (offset: number, hpBar: Item) => {
    const change: ShapeItemChanges = {};
    if (hpBar.attachedTo) {
        const tokens = await OBR.scene.items.getItems([hpBar.attachedTo]);
        if (tokens.length > 0) {
            const width = 400;
            const token = tokens[0];
            const bounds = await getImageBounds(token as Image);
            const offsetFactor = bounds.height / 150;
            offset *= offsetFactor;

            change.position = {
                x: bounds.position.x - width / 2 + bounds.width / 2,
                y: bounds.position.y + bounds.height - 47 + offset,
            };
        }
    }
    return change;
};

export const updateTextOffset = async (offset: number) => {
    const texts = await OBR.scene.items.getItems((item) => item.type === "TEXT" && infoMetadata in item.metadata);
    const changeMap = new Map<string, TextItemChanges>();
    for (const text of texts) {
        const change = await handleTextOffsetUpdate(offset, text);
        changeMap.set(text.id, change);
    }

    await updateTextChanges(changeMap);
};

export const updateText = async (show: boolean, visible: boolean, tokenId: string, data: HpTrackerMetadata) => {
    const textAttachments = await getAttachedItems(tokenId, "TEXT");

    if (!show) {
        await deleteAttachments(textAttachments);
    } else {
        const characters = await OBR.scene.items.getItems([tokenId]);
        if (characters.length > 0) {
            const character = characters[0];
            const changes = new Map<string, TextItemChanges>();
            await saveOrChangeText(character, data, textAttachments, changes, visible);
            await updateTextChanges(changes);
        }
    }
};

export const updateTextChanges = async (changes: Map<string, TextItemChanges>) => {
    if (changes.size > 0) {
        await OBR.scene.items.updateItems(
            (item): item is Text => isText(item) && changes.has(item.id),
            (texts) => {
                texts.forEach((text) => {
                    if (changes.has(text.id)) {
                        const change = changes.get(text.id);
                        if (change) {
                            if (change.text) {
                                text.text.plainText = change.text;
                            }
                            if (change.visible !== undefined) {
                                text.visible = change.visible;
                            }
                            if (change.position) {
                                text.position = change.position;
                            }
                        }
                    }
                });
            }
        );
    }
};

export const saveOrChangeText = async (
    character: Item,
    data: HpTrackerMetadata,
    attachments: Item[],
    changeMap: Map<string, TextItemChanges>,
    visible: boolean
) => {
    if (attachments.length > 0) {
        attachments.forEach((attachment) => {
            if (infoMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};

                change.text =
                    (data.hpOnMap ? `HP:${data.hp}/${data.maxHp}` : "") +
                    (data.hpOnMap && data.acOnMap ? " " : "") +
                    (data.acOnMap ? `AC:${data.armorClass}` : "");
                change.visible = visible;
                changeMap.set(attachment.id, change);
            }
        });
    } else {
        const textContent =
            (data.hpOnMap ? `HP:${data.hp}/${data.maxHp}` : "") +
            (data.hpOnMap && data.acOnMap ? " " : "") +
            (data.acOnMap ? `AC:${data.armorClass}` : "");
        const text = await createText(textContent, character as Image);
        if (text) {
            text.visible = visible;
            await OBR.scene.items.addItems([text]);
        }
    }
};

export const handleTextVisibility = async (
    character: Item,
    attachments: Text[],
    changeMap: Map<string, TextItemChanges>
) => {
    if (attachments.length > 0) {
        const data = character.metadata[characterMetadata] as HpTrackerMetadata;
        attachments.forEach((attachment) => {
            if (infoMetadata in attachment.metadata) {
                const change = changeMap.get(attachment.id) ?? {};
                if (
                    ((!character.visible && character.visible !== attachment.visible) ||
                        (character.visible && data.canPlayersSee)) &&
                    character.visible != attachment.visible
                ) {
                    change.visible = character.visible;
                    changeMap.set(attachment.id, change);
                }
            }
        });
    }
};
