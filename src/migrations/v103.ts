// in V1.0.3 we introduced local scene object and removed global scene texts. These global scene objects need to be removed because they will no longer update

import OBR, { isText } from "@owlbear-rodeo/sdk";
import { infoMetadataKey } from "../helper/variables.ts";

export const migrate102To103 = async () => {
    console.log("Migration from 102 to 103 running");
    const globalTexts = await OBR.scene.items.getItems(isText);
    const deleteTexts: string[] = [];

    globalTexts.forEach((text) => {
        if (infoMetadataKey in text.metadata) {
            deleteTexts.push(text.id);
        }
    });

    await OBR.scene.items.deleteItems(deleteTexts);
};
