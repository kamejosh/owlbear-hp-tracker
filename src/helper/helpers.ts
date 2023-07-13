import OBR, { buildText } from "@owlbear-rodeo/sdk";
import { textMetadata } from "./variables.ts";

export const createText = async (text: string, id: string) => {
    const items = await OBR.scene.items.getItems([id]);
    const width = 300;
    const height = 20;

    if (items.length > 0) {
        const item = items[0];
        const position = {
            x: item.position.x - width / 2,
            y: item.position.y + 50 + height,
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

export const getAttachedTextItem = async (id: string) => {
    const localItems = await OBR.scene.local.getItems();
    const attachments = localItems.filter((item) => item.attachedTo === id);

    return attachments.filter((attachment) => {
        return attachment.layer === "TEXT" && textMetadata in attachment.metadata;
    });
};
