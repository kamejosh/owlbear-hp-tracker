import OBR, { Item, ItemFilter } from "@owlbear-rodeo/sdk";
import { chunk, isObject } from "lodash";
import { delay } from "./helpers.ts";

export const delayDelta = 500;

/**
 * `update` may be invoked more than once - it is replayed after a rate limit retry - so it must be
 * idempotent. Collect ids it produces in a Set rather than appending to an array.
 */
export const updateItems = async (list: ItemFilter<Item> | Array<Item>, update: (items: Array<Item>) => void) => {
    try {
        await OBR.scene.items.updateItems(list, update);
    } catch (e: any) {
        if (isObject(e) && "error" in e && isObject(e.error) && "name" in e.error && e.error.name === "RateLimitHit") {
            await delay(delayDelta);
            // delay and retry
            try {
                await OBR.scene.items.updateItems(list, update);
            } catch (retryError) {
                console.warn("GM's Grimoire - updateItems failed after rate limit retry", retryError);
            }
        } else {
            console.warn("GM's Grimoire - updateItems failed", e);
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
            try {
                await OBR.scene.items.deleteItems(list);
            } catch (retryError) {
                console.warn("GM's Grimoire - deleteItems failed after rate limit retry", retryError);
            }
        } else {
            console.warn("GM's Grimoire - deleteItems failed", e);
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
            try {
                await OBR.scene.items.addItems(items);
            } catch (retryError) {
                console.warn("GM's Grimoire - addItems failed after rate limit retry", retryError);
            }
        } else {
            console.warn("GM's Grimoire - addItems failed", e);
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
