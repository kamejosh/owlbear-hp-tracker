import OBR, { Item } from "@owlbear-rodeo/sdk";
import { characterMetadata, infoMetadata } from "../helper/variables.ts";
import { deleteAttachments, getAttachedItems } from "../helper/helpers.ts";
import { AttachmentMetadata } from "../helper/types.ts";

export const migrateTo141 = async () => {
    console.log("Migration to 1.4.1 running");

    const playerRole = await OBR.player.getRole();

    if (playerRole === "GM") {
        const items = await OBR.scene.items.getItems((item) => characterMetadata in item.metadata);
        const attachments: Array<Item> = [];

        // removing all old attachments
        for (const item of items) {
            const as = await getAttachedItems(item.id, ["TEXT", "SHAPE", "CURVE"]);
            attachments.push(...as);
        }

        const hpTrackerItems = await OBR.scene.items.getItems(
            (item) => infoMetadata in item.metadata && (item.metadata[infoMetadata] as AttachmentMetadata).isHpText
        );

        await deleteAttachments([...attachments, ...hpTrackerItems]);
    }
};
