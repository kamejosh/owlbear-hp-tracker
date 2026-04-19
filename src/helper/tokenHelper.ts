import { GMGMetadata, LootMetadata, RoomMetadata } from "./types.ts";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey, lootMetadataKey } from "./variables.ts";
import { evalString } from "./helpers.ts";
import { updateHp } from "./hpHelpers.ts";
import { updateAc } from "./acHelper.ts";
import { updateItems, updateList } from "./obrHelper.ts";
import { isEqual, isObject } from "lodash";

export type HpFields = {
    hp: string;
    maxHp: string;
    tempHp: string;
};

export const updateTokenMetadata = async (tokenData: GMGMetadata, ids: Array<string>) => {
    try {
        await updateList(ids, 16, async (subList) => {
            await updateItems(subList, (items: Array<Item>) => {
                items.forEach((item) => {
                    item.metadata[itemMetadataKey] = { ...tokenData };
                });
            });
        });
    } catch (e) {
        const errorName =
            isObject(e) && "error" in e && isObject(e.error) && "name" in e.error ? e.error.name : "Undefined Error";
        console.warn(`GM's Grimoire: Error while updating token metadata of ${ids.length} tokens: ${errorName}`);
    }
};

export const updateLootMetadata = async (lootData: LootMetadata, ids: Array<string>) => {
    try {
        await updateList(ids, 16, async (subList) => {
            await updateItems(subList, (items: Array<Item>) => {
                items.forEach((item) => {
                    item.metadata[lootMetadataKey] = { ...lootData };
                });
            });
        });
    } catch (e) {
        const errorName =
            isObject(e) && "error" in e && isObject(e.error) && "name" in e.error ? e.error.name : "Undefined Error";
        console.warn(`GM's Grimoire: Error while updating loot metadata of ${ids.length} tokens: ${errorName}`);
    }
};

export const updateHpFields = async (hpFields: HpFields, data: GMGMetadata, item: Image) => {
    const newData = {
        ...data,
        hp: Number(hpFields.hp),
        maxHp: Number(hpFields.maxHp),
        stats: { ...data.stats, tempHp: Number(hpFields.tempHp) },
    };
    if (!isEqual(newData, data)) {
        await updateHp(item, newData);
        await updateTokenMetadata(newData, [item.id]);
    }
};

export const getNewHpFieldValues = (
    field: "hp" | "maxHp" | "tempHp",
    data: GMGMetadata,
    newValue?: number,
    input?: string,
    room?: RoomMetadata | null,
): HpFields => {
    const retValue: HpFields = {
        hp: data.hp.toString(),
        maxHp: data.maxHp.toString(),
        tempHp: (data.stats.tempHp ?? 0).toString(),
    };
    let value: number;
    if (input) {
        if (input.indexOf("+") > 0 || input.indexOf("-") > 0) {
            value = Number(evalString(input));
        } else {
            value = Number(input.replace(/[^0-9]/g, ""));
        }
    } else if (newValue) {
        value = newValue;
    } else {
        return retValue;
    }

    if (field === "hp") {
        let factor = 1;
        let hp;
        if (room?.allowNegativeNumbers && input) {
            factor = input.startsWith("-") ? -1 : 1;
            hp = value * factor;
        } else {
            hp = Math.max(value, 0);
        }
        if (hp < data.hp && data.stats.tempHp && data.stats.tempHp > 0) {
            retValue.tempHp = Math.max(data.stats.tempHp - (data.hp - hp), 0).toString();
        }
        if (data.maxHp == 0) {
            retValue.maxHp = Math.max(value, 0).toString();
        }
        let maxHpValue = Number(retValue.maxHp) + (data.stats.tempHp ?? 0);
        retValue.hp = Math.min(hp, maxHpValue).toString();
        return retValue;
    } else if (field === "maxHp") {
        retValue.hp = Math.min(Number(retValue.hp), Number(retValue.tempHp) + value).toString();
        return { ...retValue, maxHp: Math.max(value, 0).toString() };
    } else if (field === "tempHp") {
        if (value > 0) {
            if (!data.stats.tempHp) {
                retValue.hp = (Number(retValue.hp) + value).toString();
            } else {
                retValue.hp = (Number(retValue.hp) + value - data.stats.tempHp).toString();
            }
        }
        retValue.hp = Math.min(Number(retValue.hp), Number(retValue.maxHp) + Math.max(value, 0)).toString();
        return { ...retValue, tempHp: Math.max(value, 0).toString() };
    }
    return retValue;
};

export const changeHp = async (newHp: number, data: GMGMetadata, item: Image, room?: RoomMetadata | null) => {
    const newData = { ...data };
    if (newHp < data.hp && data.stats.tempHp && data.stats.tempHp > 0) {
        newData.stats.tempHp = Math.max(data.stats.tempHp - (data.hp - newHp), 0);
    }
    newData.hp = room?.allowNegativeNumbers ? newHp : Math.max(newHp, 0);
    await updateHp(item, newData);
    await updateTokenMetadata(newData, [item.id]);
};

export const changeTempHp = async (newTempHp: number, data: GMGMetadata, item: Image) => {
    // temporary hitpoints can't be negative
    const newData = { ...data, stats: { ...data.stats, tempHp: newTempHp } };
    if (newTempHp > 0) {
        if (!data.stats.tempHp) {
            newData.hp += newTempHp;
        } else {
            newData.hp += newTempHp - data.stats.tempHp;
        }
    }
    newData.hp = Math.min(newData.hp, newData.maxHp + newData.stats.tempHp);
    newData.stats.tempHp = Math.max(newTempHp, 0);
    if (!isEqual(newData, data)) {
        await updateHp(item, newData);
        await updateTokenMetadata(newData, [item.id]);
    }
};

export const changeArmorClass = (newAc: number, data: GMGMetadata, item: Image, room?: RoomMetadata | null) => {
    if (!room?.allowNegativeNumbers) {
        newAc = Math.max(newAc, 0);
    }
    const newData = { ...data, armorClass: newAc };
    updateAc(item, newData);
    updateTokenMetadata(newData, [item.id]);
};

export const handleOnPlayerDoubleClick = async (id: string) => {
    const bounds = await OBR.scene.items.getItemBounds([id]);
    await OBR.viewport.animateToBounds({
        ...bounds,
        min: { x: bounds.min.x - 1000, y: bounds.min.y - 1000 },
        max: { x: bounds.max.x + 1000, y: bounds.max.y + 1000 },
    });
};
