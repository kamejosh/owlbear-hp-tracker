import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { sceneMetadata } from "../helper/variables.ts";
import { SceneMetadata } from "../helper/types.ts";

// in V1.1.1 we introduced new scene metadata fields

export const migrate111To112 = async () => {
    console.log("Migration from 111 to 112 running");
    const metadata = (await OBR.scene.getMetadata()) as Metadata;
    const data = metadata[sceneMetadata] as SceneMetadata;

    if (data.hpBarSegments === undefined) {
        data.hpBarSegments = 0;
    }
    if (data.hpBarOffset === undefined) {
        data.hpBarOffset = 0;
    }

    metadata[sceneMetadata] = data;

    await OBR.scene.setMetadata(metadata);
};
