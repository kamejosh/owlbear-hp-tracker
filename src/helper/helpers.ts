import OBR, { buildShape, buildText, Image, Item, Layer } from "@owlbear-rodeo/sdk";
import { textMetadata } from "./variables.ts";

export const localItemsCache = {
    items: Array<Item>(),
    invalid: true,
};

export const createText = async (text: string, id: string) => {
    const items = await OBR.scene.items.getItems([id]);
    const width = 400;
    // height is zero, so we're not in the way when trying to move the character icon
    const height = 0;

    if (items.length > 0) {
        const item = items[0] as Image;
        const position = {
            x: item.position.x - width / 2,
            y: item.position.y + 10,
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
            .build();

        textItem.metadata[textMetadata] = { isHpText: true };
        return textItem;
    }
};

export const createShape = async (percentage: number, id: string) => {
    const width = 200;
    const height = 27;

    const items = await OBR.scene.items.getItems([id]);

    if (items.length > 0) {
        const item = items[0] as Image;
        const position = {
            x: item.position.x - width / 2,
            y: item.position.y + 26,
        };

        const backgroundShape = buildShape()
            .width(width)
            .height(height)
            .shapeType("RECTANGLE")
            .fillColor("black")
            .strokeColor("black")
            .position(position)
            .attachedTo(id)
            .layer("ATTACHMENT")
            .locked(true)
            .build();

        const hpShape = buildShape()
            .width(width * percentage - 4)
            .height(height - 4)
            .shapeType("RECTANGLE")
            .fillColor("red")
            .strokeWidth(0)
            .position({ x: position.x + 2, y: position.y + 2 })
            .attachedTo(id)
            .layer("ATTACHMENT")
            .locked(true)
            .name("hp")
            .build();

        backgroundShape.metadata[textMetadata] = { isHpText: true };
        hpShape.metadata[textMetadata] = { isHpText: true };
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
        if (item.attachedTo === id && textMetadata in item.metadata && itemType === item.type) {
            attachments.push(item);
        }
    });

    return attachments;
};
