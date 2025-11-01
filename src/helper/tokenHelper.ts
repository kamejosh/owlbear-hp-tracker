import { GMGMetadata, RoomMetadata } from "./types.ts";
import { Image, Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "./variables.ts";
import { evalString } from "./helpers.ts";
import { updateHp } from "./hpHelpers.ts";
import { RefObject } from "react";
import { updateAc } from "./acHelper.ts";
import { updateItems, updateList } from "./obrHelper.ts";
import { isObject } from "lodash";

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

export const changeHp = async (
    newHp: number,
    data: GMGMetadata,
    item: Image,
    hpRef?: RefObject<HTMLInputElement>,
    tempHpRef?: RefObject<HTMLInputElement>,
    room?: RoomMetadata | null,
) => {
    const newData = { ...data };
    if (newHp < data.hp && data.stats.tempHp && data.stats.tempHp > 0) {
        newData.stats.tempHp = Math.max(data.stats.tempHp - (data.hp - newHp), 0);
        if (tempHpRef && tempHpRef.current) {
            tempHpRef.current.value = String(newData.stats.tempHp);
        }
    }
    newData.hp = room?.allowNegativeNumbers ? newHp : Math.max(newHp, 0);
    await updateHp(item, newData);
    await updateTokenMetadata(newData, [item.id]);
    if (hpRef && hpRef.current) {
        hpRef.current.value = String(newData.hp);
    }
};

export const getNewHpValue = async (
    input: string,
    data: GMGMetadata,
    item: Image,
    maxHpRef?: RefObject<HTMLInputElement>,
    room?: RoomMetadata | null,
) => {
    let value: number;
    let factor = 1;
    if (room?.allowNegativeNumbers) {
        factor = input.startsWith("-") ? -1 : 1;
    }
    if (input.indexOf("+") > 0 || input.indexOf("-") > 0) {
        value = Number(evalString(input));
    } else {
        value = Number(input.replace(/[^0-9]/g, ""));
    }
    let hp: number;
    if (data.maxHp > 0) {
        hp = Math.min(Number(value * factor), data.stats.tempHp ? data.maxHp + data.stats.tempHp : data.maxHp);
    } else {
        hp = Number(value * factor);
        const newData = { ...data, hp: hp, maxHp: Math.max(value, 0) };
        await updateHp(item, newData);
        await updateTokenMetadata(newData, [item.id]);
        if (maxHpRef && maxHpRef.current) {
            maxHpRef.current.value = String(newData.maxHp);
        }
        return null;
    }
    return room?.allowNegativeNumbers ? hp : Math.max(hp, 0);
};

export const changeMaxHp = async (
    newMax: number,
    data: GMGMetadata,
    item: Image,
    maxHpRef?: RefObject<HTMLInputElement>,
) => {
    const newData = { ...data };
    newData.maxHp = Math.max(newMax, 0);
    let maxHp = newData.maxHp;
    if (newData.stats.tempHp) {
        maxHp += newData.stats.tempHp;
    }
    if (maxHp < newData.hp) {
        newData.hp = maxHp;
    }
    await updateHp(item, newData);
    await updateTokenMetadata(newData, [item.id]);
    if (maxHpRef && maxHpRef.current) {
        maxHpRef.current.value = String(newMax);
    }
};

export const getNewTempHp = (input: string) => {
    let value: number;
    if (input.indexOf("+") > 0 || input.indexOf("-") > 0) {
        value = Number(evalString(input));
    } else {
        value = Number(input.replace(/[^0-9]/g, ""));
    }
    return value;
};

export const changeTempHp = async (
    newTempHp: number,
    data: GMGMetadata,
    item: Image,
    hpRef?: RefObject<HTMLInputElement>,
    tempHpRef?: RefObject<HTMLInputElement>,
) => {
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
    await updateHp(item, newData);
    await updateTokenMetadata(newData, [item.id]);
    if (hpRef && hpRef.current) {
        hpRef.current.value = String(newData.hp);
    }
    if (tempHpRef && tempHpRef.current) {
        tempHpRef.current.value = String(newData.stats.tempHp);
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
