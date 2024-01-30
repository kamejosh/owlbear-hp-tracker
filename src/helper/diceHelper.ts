import { RoomMetadata } from "./types.ts";
import { dddiceRollToRollLog, updateRoomMetadata } from "./helpers.ts";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import {
    IDiceRoll,
    IRoom,
    IUser,
    Operator,
    parseRollEquation,
    ThreeDDice,
    ThreeDDiceAPI,
    ThreeDDiceRollEvent,
} from "dddice-js";
import { RollLogEntryType } from "../context/RollLogContext.tsx";

export const updateRoomMetadataDiceUser = async (
    room: RoomMetadata,
    playerId: string,
    options?: {
        apiKey?: string;
        diceTheme?: string;
    }
) => {
    const diceUser: Array<{
        playerId: string;
        apiKey: string | undefined;
        lastUse: number;
        diceTheme: string;
    }> = room.diceUser === undefined ? [] : room.diceUser;

    let apiKey = options?.apiKey;

    // This first removes the current entry for the user if it finds it
    const index = diceUser.findIndex((user) => user.playerId === playerId);
    if (index >= 0) {
        const user = diceUser[index];
        apiKey = options?.apiKey ?? user.apiKey;
        diceUser.splice(index, 1, {
            playerId: playerId,
            apiKey: options?.apiKey ?? user.apiKey,
            lastUse: new Date().getTime(),
            diceTheme: options?.diceTheme ?? user.diceTheme ?? "silvie-lr1gjqod",
        });
    } else {
        diceUser.push({
            playerId: playerId,
            apiKey: options?.apiKey,
            lastUse: new Date().getTime(),
            diceTheme: options?.diceTheme ?? "silvie-lr1gjqod",
        });
    }

    // to not pollute the room metadata we remove all users that haven't logged-in in the last month
    const filteredUser = diceUser.filter((user) => {
        return user.lastUse > new Date().getTime() - 1000 * 60 * 60 * 24 * 30;
    });

    // to keep in sync with dddice I save the dddice metadata as well (Approved by CelesteBloodreign)
    const dddiceMetadata: Metadata = {};
    dddiceMetadata[`com.dddice/${playerId}`] = apiKey;
    await updateRoomMetadata(room, { diceUser: filteredUser }, dddiceMetadata);
};

export const updateRoomMetadataDiceRoom = async (room: RoomMetadata, slug: string | undefined) => {
    // to keep in sync with dddice I save the dddice metadata as well (Approved by CelesteBloodreign)
    const dddiceMetadata: Metadata = {};
    dddiceMetadata["com.dddice/roomSlug"] = slug;
    await updateRoomMetadata(
        room,
        {
            diceRoom: {
                slug: slug,
            },
        },
        dddiceMetadata
    );
};

export const getDiceUser = async (roller: ThreeDDice) => {
    return (await roller.api?.user.get())?.data;
};

export const getDiceParticipant = async (roller: ThreeDDice, roomSlug: string | undefined, user?: IUser) => {
    let diceUser: IUser | undefined = user;
    if (diceUser === undefined) {
        diceUser = await getDiceUser(roller);
    }
    if (diceUser && roomSlug) {
        const diceRoom = (await roller.api?.room.get(roomSlug))?.data;
        // @ts-ignore we test diceUser in the if above it will not be undefined
        return diceRoom?.participants.find((p) => p.user.uuid === diceUser.uuid);
    }
    return undefined;
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
        await updateRoomMetadataDiceUser(room, playerId, { apiKey: apiKey });
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
    const participant = await getDiceParticipant(roller, diceRoom.slug);
    const name = await OBR.player.getName();

    if (participant && participant.username !== name) {
        await roller.api?.room.updateParticipant(diceRoom.slug, participant.id, {
            username: name,
        });
    }
};

export const addRollerCallbacks = async (
    roller: ThreeDDice,
    addRoll: (entry: RollLogEntryType) => void,
    component: string | undefined
) => {
    roller.on(ThreeDDiceRollEvent.RollStarted, async (e) => {
        const participant = e.room.participants.find((p) => p.user.uuid === e.user.uuid);
        const name = await OBR.player.getName();

        if (participant && participant.username !== name) {
            addRoll(await dddiceRollToRollLog(e, { participant: participant }));
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

export const removeRollerCallbacks = (roller: ThreeDDice) => {
    roller.off(ThreeDDiceRollEvent.RollStarted);
    roller.off(ThreeDDiceRollEvent.RollCreated);
};

export const dddiceLogin = async (
    room: RoomMetadata | null,
    roller: ThreeDDice,
    canvas: HTMLCanvasElement | undefined
) => {
    const diceUser = await getDiceUser(roller);
    const participant = await getDiceParticipant(roller, room?.diceRoom?.slug, diceUser);

    if (diceUser && participant && room?.diceRoom?.slug) {
        roller.api?.room.leave(room.diceRoom.slug, participant.id.toString());
        removeRollerCallbacks(roller);
    }

    try {
        if (canvas) {
            roller.initialize(canvas, await getApiKey(room), {}, `HP Tracker - ${OBR.room.id}`);
            const diceRoom = await getDiceRoom(roller, room);
            if (diceRoom) {
                const user = (await roller.api?.user.get())?.data;
                if (user) {
                    const participant = diceRoom.participants.find((p) => p.user.uuid === user.uuid);
                    if (participant) {
                        await prepareRoomUser(diceRoom, roller);
                    } else {
                        try {
                            const userDiceRoom = (await roller?.api?.room.join(diceRoom.slug, diceRoom.passcode))?.data;
                            if (userDiceRoom) {
                                await prepareRoomUser(userDiceRoom, roller);
                            }
                        } catch {
                            /**
                             * if we already joined. We already check that when
                             * looking if the user is a participant in the room,
                             * but better be safe than sorry
                             */
                        }
                    }
                    roller.connect(diceRoom.slug, diceRoom.passcode, user.uuid);
                }

                roller.start();
            }
            return true;
        }
    } catch (e) {
        return false;
    }
    return false;
};

export const diceToRoll = (diceString: string, theme: string) => {
    let dice: Array<IDiceRoll> = [];
    let operator: Operator | undefined = undefined;

    if (diceString.includes("d")) {
        try {
            const parsed = parseRollEquation(diceString, theme || "dddice-standard");
            dice = parsed.dice;
            operator = parsed.operator;
        } catch {
            const split = diceString.split("d");
            if (split.length === 2) {
                const amount = parseInt(split[0]);
                let die = split[1];

                if (die.includes("+")) {
                    const parts = die.split("+");
                    if (parts.length === 2) {
                        die = parts[0];
                        dice.push({
                            type: "mod",
                            theme: theme || "dddice-standard",
                            value: parseInt(parts[1]),
                        });
                    }
                }

                if (die.includes("-")) {
                    const parts = die.split("-");
                    if (parts.length === 2) {
                        die = parts[0];
                        dice.push({
                            type: "mod",
                            theme: theme || "dddice-standard",
                            value: parseInt(parts[1]) * -1,
                        });
                    }
                }

                for (let i = 0; i < amount; i++) {
                    dice.splice(0, 0, { type: `d${parseInt(die)}`, theme: theme || "dddice-standard" });
                }
            }
        }
    } else if (diceString.startsWith("+") || diceString.startsWith("-")) {
        dice.push({ type: "d20", theme: theme || "dddice-standard" });
        dice.push({ type: "mod", theme: theme || "dddice-standard", value: parseInt(diceString) });
    } else {
        console.warn("found dice string that could not be parsed", diceString);
    }
    return { dice, operator };
};
