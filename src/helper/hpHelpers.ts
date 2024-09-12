import OBR, { buildShape, buildText, Image, isShape, Item, Text, Shape, isText } from "@owlbear-rodeo/sdk";
import { HpTrackerMetadata, BarItemChanges, TextItemChanges, AttachmentMetadata } from "./types.ts";
import {
    attachmentFilter,
    calculatePercentage,
    deleteAttachments,
    getAttachedItems,
    getImageBounds,
    getYOffset,
} from "./helpers.ts";
import { itemMetadataKey, infoMetadataKey } from "./variables.ts";

export const createBar = async (percentage: number, tempHpPercentage: number, token: Image) => {
    const bounds = await getImageBounds(token);
    const height = Math.abs(Math.ceil(bounds.height / 4.85));
    const width = Math.abs(bounds.width);
    const position = {
        x: bounds.width < 0 ? bounds.position.x - width : bounds.position.x,
        y: bounds.position.y + bounds.height - height + (await getYOffset(bounds.height)),
    };
    const border = Math.floor(width / 75);

    const backgroundShape = buildShape()
        .width(width)
        .height(height)
        .shapeType("RECTANGLE")
        .fillColor("black")
        .fillOpacity(0.5)
        .strokeColor("black")
        .strokeOpacity(0)
        .position(position)
        .attachedTo(token.id)
        .layer("ATTACHMENT")
        .locked(true)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible)
        .build();

    const hpShape = buildShape()
        .width(percentage === 0 ? 0 : (width - border * 2) * percentage)
        .height(height - border * 2)
        .shapeType("RECTANGLE")
        .fillColor("red")
        .fillOpacity(0.5)
        .strokeWidth(0)
        .strokeOpacity(0)
        .position({ x: position.x + border, y: position.y + border })
        .attachedTo(token.id)
        .layer("ATTACHMENT")
        .locked(true)
        .disableHit(true)
        .name("hp")
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible)
        .build();

    const tempHp = buildShape()
        .width(tempHpPercentage === 0 ? 0 : (width - border * 2) * tempHpPercentage)
        .height(height - border * 2)
        .shapeType("RECTANGLE")
        .fillColor("blue")
        .fillOpacity(0.8)
        .strokeWidth(0)
        .strokeOpacity(0)
        .position({ x: position.x + border, y: position.y + border })
        .attachedTo(token.id)
        .layer("ATTACHMENT")
        .locked(true)
        .disableHit(true)
        .name("temp-hp")
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible)
        .build();

    backgroundShape.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "BAR" };
    hpShape.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "BAR" };
    tempHp.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "BAR" };
    return [backgroundShape, hpShape, tempHp];
};

const createText = async (text: string, token: Image) => {
    const bounds = await getImageBounds(token);
    const height = Math.abs(Math.ceil(bounds.height / 4.85));
    const width = Math.abs(bounds.width);
    const position = {
        x: bounds.width < 0 ? bounds.position.x - width : bounds.position.x,
        y: bounds.position.y + bounds.height - height + (await getYOffset(bounds.height)),
    };

    const textItem = buildText()
        .textType("PLAIN")
        .width(width)
        .height(height)
        .position({ ...position, y: position.y + height * 0.1 }) // remove the height * 0.1 modifier once the new rendering engine is released
        .attachedTo(token.id)
        .plainText(text)
        .locked(true)
        .textAlign("CENTER")
        .textAlignVertical("BOTTOM")
        .fontWeight(600)
        .fillColor("white")
        .strokeColor("black")
        .strokeWidth(height / 30)
        .fontSize(height)
        .lineHeight(1)
        .disableHit(true)
        .disableAttachmentBehavior(["ROTATION", "VISIBLE"])
        .visible(token.visible)
        .name("hp-text")
        .build();

    textItem.metadata[infoMetadataKey] = { isHpText: true, attachmentType: "HP" };
    return textItem;
};

const handleHpOffsetUpdate = async (offset: number, hp: Item) => {
    const change: BarItemChanges | TextItemChanges = {};
    if (hp.attachedTo) {
        const tokens = await OBR.scene.items.getItems([hp.attachedTo]);
        if (tokens.length > 0) {
            const token = tokens[0];
            const bounds = await getImageBounds(token as Image);
            const offsetFactor = Math.abs(bounds.height / 150);
            offset *= offsetFactor;
            const height = Math.abs(Math.ceil(bounds.height / 4.85));
            const width = Math.abs(bounds.width);
            const border = Math.floor(width / 75);
            const x = bounds.width < 0 ? bounds.position.x - width : bounds.position.x;

            if (hp.name === "hp" || hp.name === "temp-hp") {
                change.position = {
                    x: x + border,
                    y: bounds.position.y + bounds.height - height + offset + border,
                };
            } else if (hp.name === "hp-text") {
                change.position = {
                    x: x + 2,
                    y: bounds.position.y + bounds.height - height + offset + height * 0.1,
                };
            } else {
                change.position = {
                    x: x,
                    y: bounds.position.y + bounds.height - height + offset,
                };
            }
        }
    }
    return change;
};

export const updateHpOffset = async (offset: number) => {
    const hpBars = await OBR.scene.items.getItems(
        (item) =>
            item.type === "SHAPE" &&
            infoMetadataKey in item.metadata &&
            (item.metadata[infoMetadataKey] as AttachmentMetadata).attachmentType === "BAR"
    );
    const hpTexts = await OBR.scene.items.getItems(
        (item) =>
            item.type === "TEXT" &&
            infoMetadataKey in item.metadata &&
            (item.metadata[infoMetadataKey] as AttachmentMetadata).attachmentType === "HP"
    );
    const barChanges = new Map<string, BarItemChanges>();
    const textChanges = new Map<string, TextItemChanges>();
    for (const hp of [...hpBars, ...hpTexts]) {
        const change = await handleHpOffsetUpdate(offset, hp);
        if (hp.type === "SHAPE") {
            barChanges.set(hp.id, change);
        }
        if (hp.type === "TEXT") {
            textChanges.set(hp.id, change);
        }
    }

    await updateBarChanges(barChanges);
    await updateTextChanges(textChanges);
};

export const updateHp = async (token: Item, data: HpTrackerMetadata) => {
    const barAttachments = (await getAttachedItems(token.id, ["SHAPE"])).filter((a) => attachmentFilter(a, "BAR"));
    const textAttachments = (await getAttachedItems(token.id, ["TEXT"])).filter((a) => attachmentFilter(a, "HP"));

    if (!data.hpTrackerActive) {
        await deleteAttachments([...barAttachments, ...textAttachments]);
    } else {
        if (!data.hpBar && !data.hpOnMap) {
            await deleteAttachments([...barAttachments, ...textAttachments]);
        } else {
            if (!data.hpBar) {
                await deleteAttachments(barAttachments);
            } else {
                const barChanges = new Map<string, BarItemChanges>();
                await saveOrChangeBar(token, data, barAttachments, barChanges);
                await updateBarChanges(barChanges);
            }
            if (!data.hpOnMap) {
                await deleteAttachments(textAttachments);
            } else {
                const textChanges = new Map<string, TextItemChanges>();
                await saveOrChangeText(token, data, textAttachments, textChanges);
                await updateTextChanges(textChanges);
            }
        }
    }

    if ((data.hpBar || data.hpOnMap) && data.hpTrackerActive) {
    } else {
        await deleteAttachments(barAttachments);
    }
};

export const updateBarChanges = async (changes: Map<string, BarItemChanges>) => {
    if (changes.size > 0) {
        await OBR.scene.items.updateItems(
            (item): item is Shape => isShape(item) && changes.has(item.id),
            (shapes) => {
                shapes.forEach((shape) => {
                    if (changes.has(shape.id)) {
                        const change = changes.get(shape.id);
                        if (change) {
                            if (change.width !== undefined) {
                                shape.width = change.width;
                                // when scaling a token, the bar scale also changes which messes with the actual width, so we need to reset it
                                shape.scale = { x: 1, y: shape.scale.y };
                            }
                            if (change.visible !== undefined) {
                                shape.visible = change.visible;
                            }
                            if (change.color) {
                                shape.style.fillColor = change.color;
                            }
                            if (change.position) {
                                shape.position = change.position;
                            }
                        }
                    }
                });
            }
        );
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

export const saveOrChangeBar = async (
    character: Item,
    data: HpTrackerMetadata,
    attachments: Item[],
    shapeChanges: Map<string, BarItemChanges>
) => {
    if (attachments.length > 0) {
        for (const a of attachments) {
            const change = await handleBarAttachment(a, character as Image, shapeChanges, data);
            if (Object.keys(change).length > 0) {
                shapeChanges.set(a.id, change);
            }
        }
    } else {
        const { hpPercentage, tempHpPercentage } = await calculatePercentage(data);
        const bar = await createBar(hpPercentage, tempHpPercentage, character as Image);
        await OBR.scene.items.addItems(bar);
    }
};

export const saveOrChangeText = async (
    character: Item,
    data: HpTrackerMetadata,
    attachments: Array<Item>,
    textChanges: Map<string, TextItemChanges>
) => {
    const hpText = `${data.hp}/${data.maxHp}${!!data.stats.tempHp ? "(" + data.stats.tempHp + ")" : ""}`;
    if (attachments.length > 0) {
        for (const a of attachments) {
            const change = textChanges.get(a.id) ?? {};
            if ((a as Text).text.plainText !== hpText) {
                change.text = hpText;
            }
            if (a.visible !== (character.visible && !!data.playerMap?.hp)) {
                change.visible = character.visible && !!data.playerMap?.hp;
            }
            if (!!change.text || change.visible !== undefined) {
                textChanges.set(a.id, change);
            }
        }
    } else {
        const text = await createText(hpText, character as Image);
        text.visible = character.visible && !!data.playerMap?.hp;
        await OBR.scene.items.addItems([text]);
    }
};

const handleBarAttachment = async (
    attachment: Item,
    character: Image,
    changeMap: Map<string, BarItemChanges>,
    data: HpTrackerMetadata
): Promise<BarItemChanges> => {
    const shape = attachment as Shape;
    const bounds = await getImageBounds(character);
    const width = Math.abs(bounds.width);
    const border = Math.floor(width / 75);
    const color = shape.style.fillColor;

    if (attachment.name === "hp" && infoMetadataKey in attachment.metadata) {
        const change = changeMap.get(attachment.id) ?? {};
        const { hpPercentage } = await calculatePercentage(data);
        if (hpPercentage === 0) {
            if (color !== "black") {
                change.color = "black";
            }
        } else {
            if (color !== "red") {
                change.color = "red";
            }
        }
        change.width = hpPercentage === 0 ? 0 : (width - border * 2) * hpPercentage;
        if (shape.width !== change.width || (change.color && color !== change.color)) {
            return change;
        }
    } else if (attachment.name === "temp-hp" && infoMetadataKey in attachment.metadata) {
        const change = changeMap.get(attachment.id) ?? {};
        const { tempHpPercentage } = await calculatePercentage(data);
        if (tempHpPercentage === 0) {
            if (color !== "black") {
                change.color = "black";
            }
        } else {
            if (color !== "red") {
                change.color = "blue";
            }
        }
        change.width = tempHpPercentage === 0 ? 0 : (width - border * 2) * tempHpPercentage;
        if (shape.width !== change.width || (change.color && color !== change.color)) {
            return change;
        }
    } else if (infoMetadataKey in attachment.metadata) {
        const change = changeMap.get(attachment.id) ?? {};
        if (shape.width !== width) {
            change.width = width;
            return change;
        }
    }
    return {};
};

export const updateTextVisibility = async (tokens: Array<Item>) => {
    const textChanges = new Map<string, TextItemChanges>();
    for (const token of tokens) {
        const textAttachments = (await getAttachedItems(token.id, ["TEXT"])).filter((a) => attachmentFilter(a, "HP"));
        const data = token.metadata[itemMetadataKey] as HpTrackerMetadata;

        textAttachments.forEach((text) => {
            const change = textChanges.get(text.id) ?? {};
            if (text.visible != (token.visible && data.canPlayersSee)) {
                change.visible = token.visible && data.canPlayersSee;
                textChanges.set(text.id, change);
            }
        });
    }
    await updateTextChanges(textChanges);
};
