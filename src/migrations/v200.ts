import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { metadataKey } from "../helper/variables.ts";
import { DiceUser, RoomMetadata } from "../helper/types.ts";

export const migrateTo200 = async () => {
    console.log("Migration to 2.0.0 running");

    const roomMetadata = await OBR.room.getMetadata();

    if (metadataKey in roomMetadata) {
        const data = roomMetadata[metadataKey] as RoomMetadata;
        const diceUsers: Array<DiceUser> = [];
        data.diceUser?.forEach((diceUser) => {
            diceUsers.push({ ...diceUser, diceTheme: "dddice-bees" });
        });

        const ownRoomMetadata: Metadata = {};
        ownRoomMetadata[metadataKey] = { ...data, diceUser: diceUsers };

        await OBR.room.setMetadata(ownRoomMetadata);
    }
};
