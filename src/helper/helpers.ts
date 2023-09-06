import OBR, { Image, Item, Metadata } from "@owlbear-rodeo/sdk";
import { characterMetadata, infoMetadata, sceneMetadata } from "./variables.ts";
import { HpTrackerMetadata, SceneMetadata } from "./types.ts";

export const getYOffset = async (height: number) => {
    const metadata = (await OBR.scene.getMetadata()) as Metadata;
    const sceneData = metadata[sceneMetadata] as SceneMetadata;
    let offset = sceneData.hpBarOffset ?? 0;
    const offsetFactor = height / 150;
    offset *= offsetFactor;
    return offset;
};

export const getAttachedItems = async (id: string, itemType: string) => {
    const items = await OBR.scene.items.getItemAttachments([id]);
    // why am I not using .filter() because if I do there is a bug and I can't find it
    const attachments: Item[] = [];
    items.forEach((item) => {
        if (infoMetadata in item.metadata && itemType === item.type) {
            attachments.push(item);
        }
    });

    return attachments;
};

export const calculatePercentage = async (data: HpTrackerMetadata) => {
    const metadata = (await OBR.scene.getMetadata()) as Metadata;
    const sceneData = metadata[sceneMetadata] as SceneMetadata;
    const segments = sceneData.hpBarSegments ?? 0;

    const percentage = data.maxHp === 0 || data.hp === 0 || data.hp < 0 ? 0 : data.hp / data.maxHp;

    if (segments === 0) {
        return percentage;
    } else {
        const minStep = 100 / segments;
        const numSteps = Math.ceil((percentage * 100) / minStep);
        return (numSteps * minStep) / 100;
    }
};

export const getImageBounds = async (item: Image) => {
    const dpi = await OBR.scene.grid.getDpi();
    const dpiScale = dpi / item.grid.dpi;
    const width = item.image.width * dpiScale * item.scale.x;
    const height = item.image.height * dpiScale * item.scale.y;
    const offsetX = (item.grid.offset.x / item.image.width) * width;
    const offsetY = (item.grid.offset.y / item.image.height) * height;

    return {
        position: {
            x: item.position.x - offsetX,
            y: item.position.y - offsetY,
        },
        width: width,
        height: height,
    };
};

export const deleteAttachments = async (attachments: Item[]) => {
    if (attachments.length > 0) {
        await OBR.scene.items.deleteItems(attachments.map((attachment) => attachment.id));
    }
};

export const evalString = (s: string) => {
    const tokens = s.replace(/\s/g, "").match(/[+\-]?([0-9]+)/g) || [];

    // @ts-ignore this works but ts doesn't like it
    return tokens.reduce((sum: string, value: string) => parseFloat(sum) + parseFloat(value));
};

export const sortItems = (a: Item, b: Item) => {
    const aData = a.metadata[characterMetadata] as HpTrackerMetadata;
    const bData = b.metadata[characterMetadata] as HpTrackerMetadata;
    if (aData && bData && aData.index !== undefined && bData.index !== undefined) {
        if (aData.index < bData.index) {
            return -1;
        } else if (aData.index > bData.index) {
            return 1;
        } else {
            return 0;
        }
    }
    return 0;
};

export const generateSlug = (string: string) => {
    let str = string.replace(/^\s+|\s+$/g, "");
    str = str.toLowerCase();
    str = str
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    return str;
};
