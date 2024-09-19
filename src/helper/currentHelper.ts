import OBR, { buildShape, Image, Shape } from "@owlbear-rodeo/sdk";
import { getImageBounds } from "./helpers.ts";

const indicatorName = "GM's Grimoire - Indicator";

export const createIndicator = async (token: Image) => {
    const bounds = await getImageBounds(token);
    const width = bounds.width * 1.3;
    const height = bounds.height * 1.3;
    const position = { x: bounds.position.x + bounds.width / 2, y: bounds.position.y + bounds.height / 2 };

    const indicator = buildShape()
        .width(width)
        .height(height)
        .position(position)
        .shapeType("CIRCLE")
        .fillColor("white")
        .fillOpacity(0.5)
        .strokeOpacity(0)
        .layer("MOUNT")
        .visible(token.visible)
        .locked(true)
        .disableHit(true)
        .attachedTo(token.id)
        .name(indicatorName)
        .build();

    await OBR.scene.items.addItems([indicator]);
};

export const setIndicator = async (current: Image) => {
    const items = await OBR.scene.items.getItems<Shape>((item) => item.name === indicatorName);
    if (items.length > 0) {
        const indicator = items[0];
        const bounds = await getImageBounds(current);
        const width = bounds.width * 1.3;
        const height = bounds.height * 1.3;
        const position = { x: bounds.position.x + bounds.width / 2, y: bounds.position.y + bounds.height / 2 };
        await OBR.scene.items.updateItems([indicator], (items) => {
            if (items.length > 0) {
                const item = items[0];
                item.attachedTo = current.id;
                item.width = width;
                item.height = height;
                item.position = position;
                item.visible = current.visible;
            }
        });
    } else {
        await createIndicator(current);
    }
};

export const destroyIndicator = async () => {
    const items = await OBR.scene.items.getItems<Shape | Image>((item) => item.name === indicatorName);
    if (items.length > 0) {
        await OBR.scene.items.deleteItems(items.map((i) => i.id));
    }
};
