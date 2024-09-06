import OBR from "@owlbear-rodeo/sdk";
import { itemMetadataKey, metadataKey } from "../helper/variables.ts";
import { HpTrackerMetadata, SceneMetadata } from "../helper/types.ts";
import { updateSceneMetadata } from "../helper/helpers.ts";

export const migrateTo300 = async () => {
    console.log("Migration to 3.0.0 running");

    const sceneMetadata = await OBR.scene.getMetadata();

    if (metadataKey in sceneMetadata) {
        const data = sceneMetadata[metadataKey] as SceneMetadata;
        await updateSceneMetadata(data, { collapsedStatblocks: [] });
    }

    await OBR.scene.items.updateItems(
        (item) => itemMetadataKey in item.metadata,
        (items) => {
            items.forEach((item) => {
                const data = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                const newMetadata: HpTrackerMetadata = {
                    hp: data.hp,
                    maxHp: data.maxHp,
                    armorClass: data.armorClass,
                    hpTrackerActive: data.hpTrackerActive,
                    hpOnMap: data.hpOnMap,
                    acOnMap: data.acOnMap,
                    hpBar: data.hpBar,
                    initiative: data.initiative,
                    sheet: data.sheet,
                    stats: data.stats,
                    playerMap: {
                        hp: !!data.canPlayersSee,
                        ac: !!data.canPlayersSee,
                    },
                    ruleset: data.ruleset,
                    index: data.index,
                    group: data.group,
                    playerList: data.playerList,
                };
                item.metadata[itemMetadataKey] = newMetadata;
            });
        }
    );
};
