import OBR from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../helper/variables.ts";
import { HpTrackerMetadata } from "../helper/types.ts";

export const migrateTo140 = async () => {
    console.log("Migration to 1.4.0 running");

    await OBR.scene.items.updateItems(
        (item) => itemMetadataKey in item.metadata,
        (items) => {
            items.forEach((item) => {
                (item.metadata[itemMetadataKey] as HpTrackerMetadata).ruleset = "e5";
                (item.metadata[itemMetadataKey] as HpTrackerMetadata).stats = { initiativeBonus: 0 };
            });
        }
    );
};
