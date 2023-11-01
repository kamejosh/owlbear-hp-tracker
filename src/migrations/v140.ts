import OBR from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../helper/variables.ts";
import { HpTrackerMetadata } from "../helper/types.ts";

export const migrateTo140 = async () => {
    console.log("Migration to 1.4.0 running");

    await OBR.scene.items.updateItems(
        (item) => characterMetadata in item.metadata,
        (items) => {
            items.forEach((item) => {
                (item.metadata[characterMetadata] as HpTrackerMetadata).ruleset = "e5";
            });
        }
    );
};
