import OBR, { Image, Item, Metadata } from "@owlbear-rodeo/sdk";
import { itemMetadataKey, infoMetadataKey, metadataKey } from "./variables.ts";
import { AttachmentMetadata, HpTrackerMetadata, RoomMetadata, SceneMetadata } from "./types.ts";
import { isObject } from "lodash";

export const getYOffset = async (height: number) => {
    const metadata = (await OBR.room.getMetadata()) as Metadata;
    const roomMetadata = metadata[metadataKey] as RoomMetadata;
    let offset = roomMetadata ? roomMetadata.hpBarOffset ?? 0 : 0;
    const offsetFactor = height / 150;
    offset *= offsetFactor;
    return offset;
};

export const getACOffset = async (height: number, width: number) => {
    const metadata = (await OBR.room.getMetadata()) as Metadata;
    const roomMetadata = metadata[metadataKey] as RoomMetadata;
    let offset = roomMetadata ? roomMetadata.acOffset ?? { x: 0, y: 0 } : { x: 0, y: 0 };
    offset.x = offset.x * (width / 150);
    offset.y = offset.y * (height / 150);
    return offset;
};

export const getAttachedItems = async (id: string, itemTypes: Array<string>) => {
    const items = await OBR.scene.items.getItemAttachments([id]);
    // why am I not using .filter()? because if I do there is a bug and I can't find it
    const attachments: Item[] = [];
    items.forEach((item) => {
        if (infoMetadataKey in item.metadata && itemTypes.indexOf(item.type) >= 0) {
            attachments.push(item);
        }
    });

    return attachments;
};

export const calculatePercentage = async (data: HpTrackerMetadata) => {
    const metadata = (await OBR.room.getMetadata()) as Metadata;
    const roomMetadata = metadata[metadataKey] as RoomMetadata;
    const segments = roomMetadata ? roomMetadata.hpBarSegments ?? 0 : 0;

    const tempHp = data.stats.tempHp ?? 0;

    const percentage = data.maxHp === 0 || data.hp === 0 || data.hp < 0 ? 0 : (data.hp - tempHp) / data.maxHp;
    const tempPercentage = data.maxHp === 0 || tempHp === 0 ? 0 : tempHp / data.maxHp;

    if (segments === 0) {
        return { hpPercentage: percentage, tempHpPercentage: tempPercentage };
    } else {
        const minStep = 100 / segments;
        const numStepsHp = Math.ceil((percentage * 100) / minStep);
        const numStepsTempHp = Math.ceil((tempPercentage * 100) / minStep);
        return { hpPercentage: (numStepsHp * minStep) / 100, tempHpPercentage: (numStepsTempHp * minStep) / 100 };
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
    const aData = a.metadata[itemMetadataKey] as HpTrackerMetadata;
    const bData = b.metadata[itemMetadataKey] as HpTrackerMetadata;
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

export const sortItemsInitiative = (a: Item, b: Item) => {
    const aData = a.metadata[itemMetadataKey] as HpTrackerMetadata;
    const bData = b.metadata[itemMetadataKey] as HpTrackerMetadata;
    if (aData && bData && aData.initiative !== undefined && bData.initiative !== undefined) {
        if (aData.initiative < bData.initiative) {
            return 1;
        } else if (aData.initiative > bData.initiative) {
            return -1;
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

export const getDamage = (text: string) => {
    const regex = /\d+d\d+/gi;
    const dice = regex.exec(text);

    return dice && dice.length > 0 ? dice[0] : null;
};

export const attachmentFilter = (attachment: Item, attachmentType: "BAR" | "HP" | "AC") => {
    if (infoMetadataKey in attachment.metadata) {
        const metadata = attachment.metadata[infoMetadataKey] as AttachmentMetadata;
        return metadata.isHpText && metadata.attachmentType === attachmentType;
    }
    return false;
};

export const getBgColor = (data: HpTrackerMetadata, opacity: string = "0.2") => {
    if (data.hp === 0 && data.maxHp === 0) {
        return "#1C1B22";
    }

    const percent = data.hp / (data.stats.tempHp ? data.stats.tempHp + data.maxHp : data.maxHp);

    const g = 255 * percent;
    const r = 255 - 255 * percent;
    return "rgb(" + r + "," + g + `,0,${opacity})`;
};

export const objectsEqual = (obj1: Object, obj2: Object) => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    keys1.forEach((key) => {
        // @ts-ignore obj1 has key
        const val1 = obj1[key];
        // @ts-ignore obj1 has key
        const val2 = obj2[key];

        const areObjects = isObject(val1) && isObject(val2);
        if ((areObjects && !objectsEqual(val1, val2)) || (!areObjects && val1 !== val2)) {
            return false;
        }
    });

    return true;
};

export const updateSceneMetadata = async (scene: SceneMetadata | null, data: Partial<SceneMetadata>) => {
    const ownMetadata: Metadata = {};
    ownMetadata[metadataKey] = { ...scene, ...data };

    await OBR.scene.setMetadata({ ...ownMetadata });
};

export const updateRoomMetadata = async (room: RoomMetadata | null, data: Partial<RoomMetadata>) => {
    const ownMetadata: Metadata = {};
    ownMetadata[metadataKey] = { ...room, ...data };

    await OBR.room.setMetadata({ ...ownMetadata });
};
