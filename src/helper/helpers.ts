import OBR, { buildShape, buildText, Image, Item, Metadata } from "@owlbear-rodeo/sdk";
import { infoMetadata, sceneMetadata } from "./variables.ts";
import { HpTrackerMetadata, SceneMetadata } from "./types.ts";

export const localItemsCache = {
    items: Array<Item>(),
    invalid: true,
};

export const createText = async (text: string, id: string) => {
    const items = await OBR.scene.items.getItems([id]);
    const width = 400;
    // height is zero, so we're not in the way when trying to move the character icon
    const height = 0;
    let offset = (((await OBR.scene.getMetadata()) as Metadata)[sceneMetadata] as SceneMetadata).hpBarOffset ?? 0;

    if (items.length > 0) {
        const bounds = await OBR.scene.items.getItemBounds([id]);
        const item = items[0] as Image;
        const offsetFactor = bounds.height / 150;
        offset *= offsetFactor;
        const position = {
            x: item.position.x - width / 2,
            y: item.position.y + bounds.height / 2 - 47 + offset,
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
            .attachedTo(id as string)
            .layer("TEXT")
            .locked(true)
            .disableAttachmentBehavior(["SCALE"])
            .build();

        textItem.metadata[infoMetadata] = { isHpText: true };
        return textItem;
    }
};

export const createShape = async (percentage: number, id: string) => {
    const height = 31;
    let offset = (((await OBR.scene.getMetadata()) as Metadata)[sceneMetadata] as SceneMetadata).hpBarOffset ?? 0;
    const items = await OBR.scene.items.getItems([id]);

    if (items.length > 0) {
        const item = items[0] as Image;
        const bounds = await OBR.scene.items.getItemBounds([item.id]);
        const offsetFactor = bounds.height / 150;
        offset *= offsetFactor;
        const position = {
            x: item.position.x - bounds.width / 2,
            y: item.position.y + bounds.height / 2 - height + offset,
        };

        const backgroundShape = buildShape()
            .width(bounds.width)
            .height(height)
            .shapeType("RECTANGLE")
            .fillColor("black")
            .fillOpacity(0.5)
            .strokeColor("black")
            .strokeOpacity(0.5)
            .position(position)
            .attachedTo(id)
            .layer("ATTACHMENT")
            .locked(true)
            .disableAttachmentBehavior(["SCALE"])
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
            .attachedTo(id)
            .layer("ATTACHMENT")
            .locked(true)
            .name("hp")
            .disableAttachmentBehavior(["SCALE"])
            .build();

        backgroundShape.metadata[infoMetadata] = { isHpText: true };
        hpShape.metadata[infoMetadata] = { isHpText: true };
        return [backgroundShape, hpShape];
    }
    return [];
};

export const getAttachedItems = async (id: string, itemType: string) => {
    if (localItemsCache.invalid) {
        localItemsCache.items = await OBR.scene.local.getItems();
        localItemsCache.invalid = false;
    }

    // why am I not using .filter() because if I do there is a bug and I can't find it
    const attachments: Item[] = [];
    localItemsCache.items.forEach((item) => {
        if (item.attachedTo === id && infoMetadata in item.metadata && itemType === item.type) {
            attachments.push(item);
        }
    });

    return attachments;
};

export const calculatePercentage = async (data: HpTrackerMetadata) => {
    const metadata = (await OBR.scene.getMetadata()) as Metadata;
    const sceneData = metadata[sceneMetadata] as SceneMetadata;
    const segments = sceneData.hpBarSegments ?? 0;

    const percentage = data.maxHp === 0 || data.hp === 0 ? 0 : data.hp / data.maxHp;

    if (segments === 0) {
        return percentage;
    } else {
        const minStep = 100 / segments;
        const numSteps = Math.ceil((percentage * 100) / minStep);
        const adjustedPercentage = (numSteps * minStep) / 100;
        return adjustedPercentage;
    }
};
