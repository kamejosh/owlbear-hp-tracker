// in V1.0.6 we change from hpMode toggleing between NUM and BAR to a boolean hpBar

import OBR, { isImage } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../helper/variables.ts";

export const migrate105To106 = async () => {
    console.log("Migration from 105 to 106 running");
    await OBR.scene.items.updateItems(isImage, (images) => {
        images.forEach((image) => {
            if (itemMetadataKey in image.metadata) {
                const metadata: Object = image.metadata[itemMetadataKey] as Object;
                if (metadata.hasOwnProperty("hpMode")) {
                    // @ts-ignore
                    const currentMode = metadata.hpMode;
                    const hpBar = currentMode === "BAR";
                    // @ts-ignore
                    metadata.hpBar = hpBar;
                    // @ts-ignore
                    delete metadata.hpMode;
                    image.metadata[itemMetadataKey] = { ...metadata };
                }
            }
        });
    });
};
