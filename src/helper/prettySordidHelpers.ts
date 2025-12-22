import { UserSettings } from "../api/tabletop-almanac/useUser.ts";
import OBR from "@owlbear-rodeo/sdk";
import { prettySordidID } from "./variables.ts";
import { isObject } from "lodash";
import { updateItems } from "./obrHelper.ts";

export const setPrettySordidInitiative = async (item: string, taSettings: UserSettings, initiative: number) => {
    try {
        if (taSettings.sync_pretty_sordid) {
            await updateItems([item], (items) => {
                items.forEach((item) => {
                    item.metadata[`${prettySordidID}/metadata`] = { count: String(initiative), active: false };
                });
            });
        }
    } catch (e: any) {
        if (isObject(e) && "error" in e && isObject(e.error) && "name" in e.error && e.error.name === "RateLimitHit") {
            await OBR.notification.show("Too many changes, OBR rate limit prevented updating Pretty Sordid", "WARNING");
        }
    }
};

export const setPrettySordidActive = async (current: string | null, newCurrent: string, taSettings: UserSettings) => {
    try {
        if (taSettings.sync_pretty_sordid) {
            if (current) {
                await updateItems([current], (items) => {
                    items.forEach((i) => {
                        // @ts-ignore pretty sordid has active in metadata
                        i.metadata[`${prettySordidID}/metadata`].active = false;
                    });
                });
            }
            await updateItems([newCurrent], (items) => {
                items.forEach((i) => {
                    // @ts-ignore pretty sordid has active in metadata
                    i.metadata[`${prettySordidID}/metadata`].active = true;
                });
            });
        }
    } catch (e: any) {
        if (isObject(e) && "error" in e && isObject(e.error) && "name" in e.error && e.error.name === "RateLimitHit") {
            await OBR.notification.show("Too many changes, OBR rate limit prevented updating Pretty Sordid", "WARNING");
        }
    }
};
