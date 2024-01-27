import { RoomMetadata } from "./types.ts";
import { dddiceRollToRollLog, updateRoomMetadata } from "./helpers.ts";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { IRoom, ThreeDDice, ThreeDDiceAPI, ThreeDDiceRollEvent } from "dddice-js";
import { RollLogEntryType } from "../context/RollLogContext.tsx";

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

export const getApiKey = async (room: RoomMetadata | null) => {
    const roomMetadata = await OBR.room.getMetadata();
    const playerId = await OBR.player.getId();
    let apiKey: string | undefined;

    if (`com.dddice/${playerId}` in roomMetadata) {
        apiKey = roomMetadata[`com.dddice/${playerId}`] as string;
    } else {
        apiKey = room?.diceUser?.find((user) => user.playerId === playerId)?.apiKey;
    }

    if (!apiKey) {
        apiKey = (await new ThreeDDiceAPI(undefined, "HP Tracker").user.guest()).data;
    }

    if (room) {
        await updateRoomMetadataApiKey(room, apiKey, playerId);
    }

    return apiKey;
};

export const getDiceRoom = async (roller: ThreeDDice, room: RoomMetadata | null): Promise<IRoom | undefined> => {
    const roomMetadata = await OBR.room.getMetadata();
    let slug: string | undefined;

    if ("com.dddice/roomSlug" in roomMetadata) {
        slug = roomMetadata["com.dddice/roomSlug"] as string;
    } else {
        slug = room?.diceRoom?.slug;
    }

    if (!slug) {
        const diceRoom = (await roller.api?.room.create())?.data;

        if (room && diceRoom) {
            await updateRoomMetadataDiceRoom(room, diceRoom.slug);
        }

        return diceRoom;
    } else {
        const diceRoom = (await roller?.api?.room.get(slug))?.data;

        if (room && diceRoom) {
            await updateRoomMetadataDiceRoom(room, diceRoom.slug);
        }

        return diceRoom;
    }
};

export const prepareRoomUser = async (diceRoom: IRoom, roller: ThreeDDice) => {
    const user = (await roller.api?.user.get())?.data;
    if (user) {
        const participant = diceRoom.participants.find((p) => p.user.uuid === user.uuid);

        const name = await OBR.player.getName();

        if (participant && participant.username !== name) {
            await roller.api?.room.updateParticipant(diceRoom.slug, participant.id, {
                username: name,
            });
        }
    }
};

export const addRollerCallbacks = async (
    roller: ThreeDDice,
    name: string | null,
    addRoll: (entry: RollLogEntryType) => void,
    component: string | undefined
) => {
    roller.on(ThreeDDiceRollEvent.RollStarted, async (e) => {
        const participant = e.room.participants.find((p) => p.user.uuid === e.user.uuid);

        if (participant && participant.username !== name) {
            addRoll(await dddiceRollToRollLog(e, participant));
        }
    });

    roller.on(ThreeDDiceRollEvent.RollCreated, async (e) => {
        const user = (await roller.api?.user.get())?.data;
        if (e.external_id !== component && user && user.uuid === e.user.uuid) {
            // roller.clear();
            // TODO: this does currently not work, as dddice does not provide a way to prevent 3d rolls
            /*e.values.forEach((value) => {
                // @ts-ignore calling a private message
                roller.removeDieByUuid(value.uuid);
            });*/
        }
    });
};
