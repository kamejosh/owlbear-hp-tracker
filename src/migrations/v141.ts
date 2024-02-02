import OBR, { Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey, infoMetadataKey } from "../helper/variables.ts";
import { deleteAttachments, getAttachedItems } from "../helper/helpers.ts";
import { AttachmentMetadata } from "../helper/types.ts";

export const migrateTo141 = async () => {
    console.log("Migration to 1.4.1 running");

    const playerRole = await OBR.player.getRole();

    if (playerRole === "GM") {
        const items = await OBR.scene.items.getItems((item) => itemMetadataKey in item.metadata);
        const attachments: Array<Item> = [];

        // removing all old attachments
        for (const item of items) {
            const as = await getAttachedItems(item.id, ["TEXT", "SHAPE", "CURVE"]);
            attachments.push(...as);
        }

        const hpTrackerItems = await OBR.scene.items.getItems(
            (item) =>
                infoMetadataKey in item.metadata && (item.metadata[infoMetadataKey] as AttachmentMetadata).isHpText
        );

        await deleteAttachments([...attachments, ...hpTrackerItems]);
    }
};
