import { characterMetadata } from "./variables.ts";
import { HpTrackerMetadata } from "./types.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { updateHp } from "./hpHelpers.ts";
import { updateAc } from "./acHelper.ts";

export const getHpBar = (list: Array<Item>) => {
    const hpBars = list.map((token) => {
        const metadata = token.metadata[characterMetadata] as HpTrackerMetadata;
        return metadata.hpBar;
    });
    return hpBars.some((bar) => bar);
};

export const toggleHpBar = async (list: Array<Item>) => {
    const current = getHpBar(list);
    await OBR.scene.items.updateItems(list, (items) => {
        items.forEach((item) => {
            (item.metadata[characterMetadata] as HpTrackerMetadata).hpBar = !current;
        });
    });
    for (const item of list) {
        const data = item.metadata[characterMetadata] as HpTrackerMetadata;
        await updateHp(item, { ...data, hpBar: !current });
    }
};

export const getHpOnMap = (list: Array<Item>) => {
    const hpMap = list.map((token) => {
        const metadata = token.metadata[characterMetadata] as HpTrackerMetadata;
        return metadata.hpOnMap;
    });
    return hpMap.some((map) => map);
};

export const toggleHpOnMap = async (list: Array<Item>) => {
    const current = getHpOnMap(list);
    await OBR.scene.items.updateItems(list, (items) => {
        items.forEach((item) => {
            (item.metadata[characterMetadata] as HpTrackerMetadata).hpOnMap = !current;
        });
    });
    for (const item of list) {
        const data = item.metadata[characterMetadata] as HpTrackerMetadata;
        await updateHp(item, { ...data, hpOnMap: !current });
    }
};

export const getAcOnMap = (list: Array<Item>) => {
    const acMap = list.map((token) => {
        const metadata = token.metadata[characterMetadata] as HpTrackerMetadata;
        return metadata.acOnMap;
    });
    return acMap.some((map) => map);
};

export const toggleAcOnMap = async (list: Array<Item>) => {
    const current = getAcOnMap(list);
    await OBR.scene.items.updateItems(list, (items) => {
        items.forEach((item) => {
            (item.metadata[characterMetadata] as HpTrackerMetadata).acOnMap = !current;
        });
    });
    for (const item of list) {
        const data = item.metadata[characterMetadata] as HpTrackerMetadata;
        await updateAc(item, { ...data, acOnMap: !current });
    }
};
export const getCanPlayersSee = (list: Array<Item>) => {
    const canSee = list.map((token) => {
        const metadata = token.metadata[characterMetadata] as HpTrackerMetadata;
        return metadata.canPlayersSee;
    });
    return canSee.some((see) => see);
};

export const toggleCanPlayerSee = async (list: Array<Item>) => {
    const current = getCanPlayersSee(list);
    await OBR.scene.items.updateItems(list, (items) => {
        items.forEach((item) => {
            (item.metadata[characterMetadata] as HpTrackerMetadata).canPlayersSee = !current;
        });
    });
    for (const item of list) {
        const data = item.metadata[characterMetadata] as HpTrackerMetadata;
        await updateHp(item, { ...data, canPlayersSee: !current });
        await updateAc(item, { ...data, canPlayersSee: !current });
    }
};
