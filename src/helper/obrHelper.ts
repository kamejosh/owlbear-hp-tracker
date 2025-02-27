import OBR, { Item, ItemFilter } from "@owlbear-rodeo/sdk";
import { chunk, isObject } from "lodash";
import { delay } from "./helpers.ts";

export const delayDelta = 500;

export const updateItems = async (list: ItemFilter<Item>, update: (items: Array<Item>) => void) => {
    try {
        await OBR.scene.items.updateItems(list, update);
    } catch (e: any) {
        if (isObject(e) && "error" in e && isObject(e.error) && "name" in e.error && e.error.name === "RateLimitHit") {
            await delay(delayDelta);
            // delay and retry
            await OBR.scene.items.updateItems(list, update);
        }
    }
};

export const deleteItems = async (list: Array<string>) => {
    try {
        await OBR.scene.items.deleteItems(list);
    } catch (e: any) {
        if (isObject(e) && "error" in e && isObject(e.error) && "name" in e.error && e.error.name === "RateLimitHit") {
            await delay(delayDelta);
            // delay and retry
            await OBR.scene.items.deleteItems(list);
        }
    }
};

export const addItems = async (items: Array<Item>) => {
    try {
        await OBR.scene.items.addItems(items);
    } catch (e: any) {
        if (isObject(e) && "error" in e && isObject(e.error) && "name" in e.error && e.error.name === "RateLimitHit") {
            await delay(1000);
            // delay and retry
            await OBR.scene.items.addItems(items);
        }
    }
};

export const updateList = async <T>(list: Array<T>, chunkSize: number, update: (list: Array<T>) => Promise<void>) => {
    const chunks = chunk(list, chunkSize);

    for (const subList of chunks) {
        const start = new Date();
        await update(subList);
        const end = new Date();
        const delta = end.getTime() - start.getTime();
        if (delta < delayDelta) {
            await delay(delayDelta - delta);
        }
    }
};
