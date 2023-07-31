import OBR, { buildShape, buildText, Image, Item } from "@owlbear-rodeo/sdk";
import { infoMetadata } from "./variables.ts";

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
            y: item.position.y + item.image.height / 4 - 47,
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
    let width = 200;
    const height = 31;

    const items = await OBR.scene.items.getItems([id]);

    if (items.length > 0) {
        const item = items[0] as Image;
        width = item.image.width / 2;
        const position = {
            x: item.position.x - width / 2,
            y: item.position.y + item.image.height / 4 - height,
        };

        const backgroundShape = buildShape()
            .width(width)
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
            .width(percentage === 0 ? 0 : width * percentage - 4)
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
