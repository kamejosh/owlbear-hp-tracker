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
import { characterMetadata, infoMetadata } from "./variables.ts";

export const createBar = async (percentage: number, tempHpPercentage: number, token: Image) => {
    const bounds = await getImageBounds(token);
    const height = Math.ceil(bounds.height / 4.85);
    const position = {
        x: bounds.position.x,
        y: bounds.position.y + bounds.height - height + (await getYOffset(bounds.height)),
    };
    const border = Math.floor(bounds.width / 75);

    const backgroundShape = buildShape()
        .width(bounds.width)
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
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible)
        .build();

    const hpShape = buildShape()
        .width(percentage === 0 ? 0 : (bounds.width - border * 2) * percentage)
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
        .name("hp")
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible)
        .build();

    const tempHp = buildShape()
        .width(tempHpPercentage === 0 ? 0 : (bounds.width - border * 2) * tempHpPercentage)
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
        .name("temp-hp")
        .disableAttachmentBehavior(["ROTATION"])
        .visible(token.visible)
        .build();

    backgroundShape.metadata[infoMetadata] = { isHpText: true, attachmentType: "BAR" };
    hpShape.metadata[infoMetadata] = { isHpText: true, attachmentType: "BAR" };
    tempHp.metadata[infoMetadata] = { isHpText: true, attachmentType: "BAR" };
    return [backgroundShape, hpShape, tempHp];
};

const createText = async (text: string, token: Image) => {
    const bounds = await getImageBounds(token);
    const height = Math.ceil(bounds.height / 4.85);
    const position = {
        x: bounds.position.x,
        y: bounds.position.y + bounds.height - height + (await getYOffset(bounds.height)),
    };
    const textItem = buildText()
        .textType("PLAIN")
        .width(bounds.width)
        .height(height * 0.8) // because of text lines leaving space below we have to move it to the middle manually
        .position({ ...position, y: position.y + height * 0.2 })
        .attachedTo(token.id)
        .plainText(text)
        .locked(true)
        .textAlign("CENTER")
        .textAlignVertical("MIDDLE")
        .fontWeight(600)
        .fillColor("white")
        .strokeColor("black")
        .strokeWidth(height / 30)
        .fontSize(height * 0.8)
        .disableAttachmentBehavior(["ROTATION", "VISIBLE"])
        .visible(token.visible)
        .build();

    textItem.metadata[infoMetadata] = { isHpText: true, attachmentType: "HP" };
    return textItem;
};

const handleHpOffsetUpdate = async (offset: number, hp: Item) => {
    const change: BarItemChanges | TextItemChanges = {};
    if (hp.attachedTo) {
        const tokens = await OBR.scene.items.getItems([hp.attachedTo]);
        if (tokens.length > 0) {
            const token = tokens[0];
            const bounds = await getImageBounds(token as Image);
            const offsetFactor = bounds.height / 150;
            offset *= offsetFactor;
            const height = Math.ceil(bounds.height / 4.85);
            const border = Math.floor(bounds.width / 75);
            if (hp.name === "hp") {
                change.position = {
                    x: bounds.position.x + border,
                    y: bounds.position.y + bounds.height - height + offset + border,
                };
            } else if (hp.name === "hp-text") {
                change.position = {
                    x: bounds.position.x + 2,
                    y: bounds.position.y + bounds.height - height + offset + height * 0.2,
                };
            } else {
                change.position = {
                    x: bounds.position.x,
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
            infoMetadata in item.metadata &&
            (item.metadata[infoMetadata] as AttachmentMetadata).attachmentType === "BAR"
    );
    const hpTexts = await OBR.scene.items.getItems(
        (item) =>
            item.type === "TEXT" &&
            infoMetadata in item.metadata &&
            (item.metadata[infoMetadata] as AttachmentMetadata).attachmentType === "HP"
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

const updateBarChanges = async (changes: Map<string, BarItemChanges>) => {
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

const updateTextChanges = async (changes: Map<string, TextItemChanges>) => {
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

const saveOrChangeBar = async (
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

const saveOrChangeText = async (
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
            if (a.visible !== (character.visible && data.canPlayersSee)) {
                change.visible = character.visible && data.canPlayersSee;
            }
            if (!!change.text || change.visible !== undefined) {
                textChanges.set(a.id, change);
            }
        }
    } else {
        const text = await createText(hpText, character as Image);
        text.visible = character.visible && data.canPlayersSee;
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
    const width = bounds.width;
    const border = Math.floor(bounds.width / 75);

    if (attachment.name === "hp" && infoMetadata in attachment.metadata) {
        const change = changeMap.get(attachment.id) ?? {};
        const { hpPercentage } = await calculatePercentage(data);
        if (hpPercentage === 0) {
            change.color = "black";
        } else {
            change.color = "red";
        }
        change.width = hpPercentage === 0 ? 0 : (width - border * 2) * hpPercentage;
        if (shape.width != change.width || shape.style.fillColor != change.color) {
            return change;
        }
    } else if (attachment.name === "temp-hp" && infoMetadata in attachment.metadata) {
        const change = changeMap.get(attachment.id) ?? {};
        const { tempHpPercentage } = await calculatePercentage(data);
        if (tempHpPercentage === 0) {
            change.color = "black";
        } else {
            change.color = "blue";
        }
        change.width = tempHpPercentage === 0 ? 0 : (width - border * 2) * tempHpPercentage;
        if (shape.width != change.width || shape.style.fillColor != change.color) {
            return change;
        }
    } else if (infoMetadata in attachment.metadata) {
        const change = changeMap.get(attachment.id) ?? {};
        if (shape.width != width) {
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
        const data = token.metadata[characterMetadata] as HpTrackerMetadata;

        textAttachments.forEach((text) => {
            const change = textChanges.get(text.id) ?? {};
            if (text.visible != (token.visible && data.canPlayersSee)) {
                change.visible = token.visible && data.canPlayersSee;
                textChanges.set(text.id, change);
            }
        });
    }
    updateTextChanges(textChanges);
};
