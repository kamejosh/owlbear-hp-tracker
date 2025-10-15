import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { metadataKey } from "../helper/variables.ts";
import { DICE_ROLLER, RoomMetadata } from "../helper/types.ts";

export const migrateTo350 = async () => {
    console.log("Migration to 3.5.0 running");

    const roomMetadata = await OBR.room.getMetadata();

    if (metadataKey in roomMetadata) {
        const data: Object = roomMetadata[metadataKey] as RoomMetadata;

        if (data.hasOwnProperty("disableDiceRoller")) {
            // @ts-ignore legacy metadata has disableDiceRoller
            const diceRoller: DICE_ROLLER = data.disableDiceRoller ? DICE_ROLLER.SIMPLE : DICE_ROLLER.DDDICE;
            const ownRoomMetadata: Metadata = {};
            ownRoomMetadata[metadataKey] = { ...data, diceRoller: diceRoller, disableDiceRoller: undefined };
            await OBR.room.setMetadata(ownRoomMetadata);
        }
    }
};
