import { RoomMetadata } from "./types.ts";
import { updateRoomMetadata } from "./helpers.ts";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";

export const updateRoomMetadataApiKey = async (room: RoomMetadata, apiKey: string | undefined, playerId: string) => {
    const diceUser: Array<{ playerId: string; apiKey: string | undefined; lastUse: number }> =
        room.diceUser === undefined ? [] : room.diceUser;

    // This first removes the current entry for the user if it finds it and replaces it with updated apiKey and lastUser timestamp
    diceUser.splice(
        diceUser.findIndex((user) => user.playerId === playerId),
        1,
        { playerId: playerId, apiKey: apiKey, lastUse: new Date().getTime() }
    );

    // to not pollute the room metadata we remove all users that haven't logged in in the last month
    const filteredUser = diceUser.filter((user) => {
        return user.lastUse > new Date().getTime() - 1000 * 60 * 60 * 24 * 30;
    });

    await updateRoomMetadata(room, { diceUser: filteredUser });

    // to keep in sync with dddice I save the dddice metadata as well (Approved by CelesteBloodreign)
    const dddiceMetadata: Metadata = {};
    dddiceMetadata[`com.dddice/${playerId}`] = apiKey;
    await OBR.room.setMetadata({ ...dddiceMetadata });
};

export const updateRoomMetadataDiceRoom = async (room: RoomMetadata, slug: string | undefined) => {
    await updateRoomMetadata(room, {
        diceRoom: {
            slug: slug,
        },
    });

    // to keep in sync with dddice I save the dddice metadata as well (Approved by CelesteBloodreign)
    const dddiceMetadata: Metadata = {};
    dddiceMetadata["com.dddice/roomSlug"] = slug;
    await OBR.room.setMetadata({ ...dddiceMetadata });
};
