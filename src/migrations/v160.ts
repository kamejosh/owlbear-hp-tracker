import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { metadataKey } from "../helper/variables.ts";
import { SceneMetadata_Deprecated } from "../helper/types.ts";

export const migrateTo160 = async () => {
    console.log("Migration to 1.6.0 running");

    const sceneData = await OBR.scene.getMetadata();

    if (metadataKey in sceneData) {
        const hpSceneData = sceneData[metadataKey] as SceneMetadata_Deprecated;
        const ownRoomMetadata: Metadata = {};
        const ownSceneMetadata: Metadata = {};

        ownRoomMetadata[metadataKey] = {
            allowNegativeNumbers: hpSceneData.allowNegativeNumbers,
            hpBarSegments: hpSceneData.hpBarSegments,
            hpBarOffset: hpSceneData.hpBarOffset,
            acOffset: hpSceneData.acOffset,
            acShield: hpSceneData.acShield,
            playerSort: hpSceneData.playerSort,
            statblockPopover: hpSceneData.statblockPopover,
            initiativeDice: hpSceneData.initiativeDice,
            ruleset: hpSceneData.ruleset,
        };

        ownSceneMetadata[metadataKey] = {
            version: hpSceneData.version,
            id: hpSceneData.id,
            groups: hpSceneData.groups,
            openGroups: hpSceneData.openGroups,
        };

        await OBR.scene.setMetadata(ownSceneMetadata);
        await OBR.room.setMetadata(ownRoomMetadata);
    }
};
