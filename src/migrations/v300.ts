import OBR from "@owlbear-rodeo/sdk";
import { metadataKey } from "../helper/variables.ts";
import { SceneMetadata } from "../helper/types.ts";
import { updateSceneMetadata } from "../helper/helpers.ts";

export const migrateTo300 = async () => {
    console.log("Migration to 3.0.0 running");

    const sceneMetadata = await OBR.scene.getMetadata();

    if (metadataKey in sceneMetadata) {
        const data = sceneMetadata[metadataKey] as SceneMetadata;
        await updateSceneMetadata(data, { collapsedStatblocks: [] });
    }
};
