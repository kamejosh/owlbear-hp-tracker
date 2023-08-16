import OBR, { buildShape, Image, isShape, Item, Shape } from "@owlbear-rodeo/sdk";
import { HpTrackerMetadata, ShapeItemChanges } from "./types.ts";
import { calculatePercentage, deleteAttachments, getAttachedItems, getImageBounds, getYOffset } from "./helpers.ts";
import { infoMetadata } from "./variables.ts";

export const createShape = async (percentage: number, token: Image) => {
    const height = 31;
    const bounds = await getImageBounds(token);
    const position = {
        x: bounds.position.x,
        y: bounds.position.y + bounds.height - height + (await getYOffset(bounds.height)),
    };

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
        .build();

    const hpShape = buildShape()
        .width(percentage === 0 ? 0 : (bounds.width - 4) * percentage)
        .height(height - 4)
        .shapeType("RECTANGLE")
        .fillColor("red")
        .fillOpacity(0.5)
        .strokeWidth(0)
        .strokeOpacity(0)
        .position({ x: position.x + 2, y: position.y + 2 })
        .attachedTo(token.id)
        .layer("ATTACHMENT")
        .locked(true)
        .name("hp")
        .disableAttachmentBehavior(["ROTATION"])
        .build();

    backgroundShape.metadata[infoMetadata] = { isHpText: true };
    hpShape.metadata[infoMetadata] = { isHpText: true };
    return [backgroundShape, hpShape];
};

const handleHpBarOffsetUpdate = async (offset: number, hpBar: Item) => {
    const change: ShapeItemChanges = {};
    if (hpBar.attachedTo) {
        const tokens = await OBR.scene.items.getItems([hpBar.attachedTo]);
        if (tokens.length > 0) {
            const token = tokens[0];
            const bounds = await getImageBounds(token as Image);
            const offsetFactor = bounds.height / 150;
            offset *= offsetFactor;
            const height = 31;
            if (hpBar.name === "hp") {
                change.position = {
                    x: bounds.position.x + 2,
                    y: bounds.position.y + bounds.height - height + offset + 2,
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

export const updateHpBarOffset = async (offset: number) => {
    const hpBars = await OBR.scene.items.getItems((item) => item.type === "SHAPE" && infoMetadata in item.metadata);
    const changeMap = new Map<string, ShapeItemChanges>();
    for (const hpBar of hpBars) {
        const change = await handleHpBarOffsetUpdate(offset, hpBar);
        changeMap.set(hpBar.id, change);
    }

    await updateShapeChanges(changeMap);
};

export const updateHpBar = async (show: boolean, tokenId: string, data: HpTrackerMetadata) => {
    const shapeAttachments = await getAttachedItems(tokenId, "SHAPE");

    if (!show) {
        await deleteAttachments(shapeAttachments);
    } else {
        const characters = await OBR.scene.items.getItems([tokenId]);
        if (characters.length > 0) {
            const character = characters[0];
            const changes = new Map<string, ShapeItemChanges>();
            await saveOrChangeShape(character, data, shapeAttachments, changes);

            await updateShapeChanges(changes);
        }
    }
};

const updateShapeChanges = async (changes: Map<string, ShapeItemChanges>) => {
    if (changes.size > 0) {
        await OBR.scene.items.updateItems(isShape, (shapes) => {
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
        });
    }
};
export const saveOrChangeShape = async (
    character: Item,
    data: HpTrackerMetadata,
    attachments: Item[],
    changeMap: Map<string, ShapeItemChanges>
) => {
    if (attachments.length > 0) {
        for (const a of attachments) {
            const change = await handleShapeAttachment(a, character as Image, changeMap, data);
            changeMap.set(a.id, change);
        }
    } else {
        const percentage = await calculatePercentage(data);
        const shapes = await createShape(percentage, character as Image);
        await OBR.scene.items.addItems(shapes);
    }
};

const handleShapeAttachment = async (
    attachment: Item,
    character: Image,
    changeMap: Map<string, ShapeItemChanges>,
    data: HpTrackerMetadata
): Promise<ShapeItemChanges> => {
    const shape = attachment as Shape;
    const bounds = await getImageBounds(character);
    const width = bounds.width;

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
