import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { sceneMetadata } from "../helper/variables.ts";
import { SceneMetadata } from "../helper/types.ts";

// in V1.1.1 we introduced a new scene metadata field allowNegativeNumbers

export const migrate112To113 = async () => {
    console.log("Migration from 112 to 113 running");
    const metadata = (await OBR.scene.getMetadata()) as Metadata;
    const data = metadata[sceneMetadata] as SceneMetadata;

    if (data.allowNegativeNumbers === undefined) {
        data.allowNegativeNumbers = false;
    }

    metadata[sceneMetadata] = data;

    await OBR.scene.setMetadata(metadata);
};
