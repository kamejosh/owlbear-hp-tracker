import { RoomMetadata } from "./types.ts";
import { dddiceRollToRollLog, updateRoomMetadata } from "./helpers.ts";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import {
    IAvailableDie,
    IDiceRoll,
    IDiceRollOptions,
    IDieType,
    IRoll,
    IRoom,
    IRoomParticipant,
    ITheme,
    IUser,
    Operator,
    parseRollEquation,
    ThreeDDiceAPI,
    ThreeDDiceRollEvent,
} from "dddice-js";
import { RollLogEntryType, rollLogStore } from "../context/RollLogContext.tsx";
import { rollLogPopover, rollLogPopoverId, rollMessageChannel } from "./variables.ts";
import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import { v4 } from "uuid";
import { diceRollerStore } from "../context/DDDiceContext.tsx";
import { CustomDieNotation, diceButtonsStore } from "../context/DiceButtonContext.tsx";

let rollLogTimeOut: number;

export const updateRoomMetadataDiceUser = async (
    room: RoomMetadata,
    playerId: string,
    options?: {
        apiKey?: string;
        diceTheme?: string;
        diceRendering?: boolean;
    },
) => {
    const diceUser: Array<{
        playerId: string;
        apiKey: string | undefined;
        lastUse: number;
        diceTheme: string;
        diceRendering: boolean;
    }> = room.diceUser === undefined ? [] : room.diceUser;

    // This first removes the current entry for the user if it finds it
    const index = diceUser.findIndex((user) => user.playerId === playerId);
    if (index >= 0) {
        const user = diceUser[index];
        diceUser.splice(index, 1, {
            playerId: playerId,
            apiKey: options?.apiKey ?? user.apiKey,
            lastUse: new Date().getTime(),
            diceTheme: options?.diceTheme ?? user.diceTheme ?? "dddice-bees",
            diceRendering: options?.diceRendering ?? user.diceRendering ?? true,
        });
    } else {
        diceUser.push({
            playerId: playerId,
            apiKey: options?.apiKey,
            lastUse: new Date().getTime(),
            diceTheme: options?.diceTheme ?? "dddice-bees",
            diceRendering: options?.diceRendering ?? true,
        });
    }

    // to not pollute the room metadata we remove all users that haven't logged-in in the last month
    const filteredUser = diceUser.filter((user) => {
        return user.lastUse > new Date().getTime() - 1000 * 60 * 60 * 24 * 30;
    });

    await updateRoomMetadata(room, { diceUser: filteredUser }, undefined, true);
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
        dddiceMetadata,
    );
};
export const getDiceUser = async (rollerApi: ThreeDDiceAPI) => {
    return (await rollerApi?.user.get())?.data;
};

export const getDiceParticipant = async (rollerApi: ThreeDDiceAPI, roomSlug: string | undefined, user?: IUser) => {
    let diceUser: IUser | undefined = user;
    if (diceUser === undefined) {
        diceUser = await getDiceUser(rollerApi);
    }
    if (diceUser && roomSlug) {
        const diceRoom = (await rollerApi.room.get(roomSlug))?.data;
        // @ts-ignore we test diceUser in the if above it will not be undefined
        return diceRoom?.participants.find((p) => p.user.uuid === diceUser.uuid);
    }
    return undefined;
};

export const getApiKey = async (room: RoomMetadata | null) => {
    const roomMetadata = await OBR.room.getMetadata();
    const playerId = await OBR.player.getId();
    //TODO: we currently use the playerId but this changes a lot. player names would probably be better.
    let apiKey: string | undefined = room?.diceUser?.find((user) => user.playerId === playerId)?.apiKey;
    let updateKey: boolean = false;

    if (!apiKey && `com.dddice/${playerId}` in roomMetadata) {
        apiKey = roomMetadata[`com.dddice/${playerId}`] as string;
        updateKey = true;
    }

    if (!apiKey) {
        apiKey = (await new ThreeDDiceAPI(undefined, "GM's Grimoire").user.guest()).data;
        updateKey = true;
    }

    if (room && updateKey) {
        await updateRoomMetadataDiceUser(room, playerId, { apiKey: apiKey });
    }

    return apiKey;
};

export const getDiceRoom = async (
    rollerApi: ThreeDDiceAPI,
    room: RoomMetadata | null,
    diceRoom?: IRoom,
): Promise<IRoom | undefined> => {
    const roomMetadata = await OBR.room.getMetadata();
    let slug: string | undefined;

    if ("com.dddice/roomSlug" in roomMetadata) {
        slug = roomMetadata["com.dddice/roomSlug"] as string;
    } else {
        slug = room?.diceRoom?.slug;
    }

    if (diceRoom && diceRoom.slug === slug) {
        return diceRoom;
    }

    if (!slug) {
        const diceRoom = (await rollerApi.room.create())?.data;

        if (room && diceRoom) {
            await updateRoomMetadataDiceRoom(room, diceRoom.slug);
        }

        return diceRoom;
    } else {
        try {
            const diceRoom = (await rollerApi?.room.get(slug))?.data;
            if (room && diceRoom) {
                await updateRoomMetadataDiceRoom(room, diceRoom.slug);
                return diceRoom;
            }
        } catch (e) {
            // @ts-ignore
            if (e.response.status === 404) {
                // it seems like a room with no logged in users is removed after some time, so in that case we need to create a new one
                const newDiceRoom = (await rollerApi?.room.create())?.data;
                if (room && newDiceRoom) {
                    await updateRoomMetadataDiceRoom(room, newDiceRoom.slug);
                    return newDiceRoom;
                } else {
                    console.warn("GM's Grimoire - unable to connect to dddice room");
                }
            }
        }

        return undefined;
    }
};

export const prepareRoomUser = async (diceRoom: IRoom, rollerApi: ThreeDDiceAPI, user: IUser) => {
    const participant = await getDiceParticipant(rollerApi, diceRoom.slug, user);
    const name = await OBR.player.getName();

    if (participant) {
        setCustomDiceButtons(participant);
    }

    if (participant && participant.username !== name) {
        await rollerApi.room.updateParticipant(diceRoom.slug, participant.id, {
            username: name,
        });
    }
};

export const handleNewRoll = async (addRoll: (entry: RollLogEntryType) => void, rollLogEntry: RollLogEntryType) => {
    addRoll(rollLogEntry);

    await OBR.popover.open(rollLogPopover);

    if (rollLogTimeOut) {
        clearTimeout(rollLogTimeOut);
    }

    rollLogTimeOut = setTimeout(async () => {
        await OBR.popover.close(rollLogPopoverId);
    }, 7500);
};

export const rollerCallback = async (e: IRoll, addRoll: (entry: RollLogEntryType) => void) => {
    const participant = e.room.participants.find((p) => p.user.uuid === e.user.uuid);
    const rollLogEntry = await dddiceRollToRollLog(e, { participant: participant });

    // we only handle new rolls dddice extension is not loaded
    if (!diceRollerStore.getState().dddiceExtensionLoaded) {
        await handleNewRoll(addRoll, rollLogEntry);
    } else {
        addRoll(rollLogEntry);
    }
};

export const addRollerApiCallbacks = async (roller: ThreeDDiceAPI, addRoll: (entry: RollLogEntryType) => void) => {
    roller.listen(ThreeDDiceRollEvent.RollCreated, (e) => rollerCallback(e, addRoll));
};

export const removeRollerApiCallbacks = async () => {
    // TODO: dddice sdk does not provide this function yet
};

const setCustomDiceButtons = (participant: IRoomParticipant) => {
    const validDice = ["d2", "d4", "d6", "d8", "d10", "d12", "d16", "d20"];
    const diceButtons = diceButtonsStore.getState().buttons;
    let count = 1;
    participant.dice_tray.forEach((dice_array) => {
        dice_array.forEach((d) => {
            if (count <= 8) {
                // @ts-ignore
                const currentCustomDice: CustomDieNotation = diceButtons[String(count)];
                if (d && validDice.includes(d.dieType) && currentCustomDice === null) {
                    // @ts-ignore
                    diceButtons[String(count)] = { dice: `1${d.dieType}`, theme: d.theme };
                    count++;
                }
            }
        });
    });
    diceButtonsStore.getState().setButtons(diceButtons);
};

export const dddiceApiLogin = async (room: RoomMetadata | null, user?: IUser) => {
    const rollerApi = new ThreeDDiceAPI(await getApiKey(room), "GM's Grimoire");
    return connectToDddiceRoom(rollerApi, room, user);
};

export const connectToDddiceRoom = async (
    api: ThreeDDiceAPI,
    room: RoomMetadata | null,
    user?: IUser,
    currentDiceRoom?: IRoom,
) => {
    const diceRoom = await getDiceRoom(api, room, currentDiceRoom);
    if (diceRoom) {
        let diceUser: IUser | undefined = user;
        if (!diceUser) {
            diceUser = (await api.user.get())?.data;
        }
        if (diceUser) {
            const participant = diceRoom.participants.find((p) => p.user.uuid === diceUser.uuid);
            if (participant) {
                await prepareRoomUser(diceRoom, api, diceUser);
            } else {
                try {
                    const userDiceRoom = (await api?.room.join(diceRoom.slug, diceRoom.passcode))?.data;
                    if (userDiceRoom) {
                        await prepareRoomUser(userDiceRoom, api, diceUser);
                    }
                } catch (e) {
                    console.warn(e);
                    /**
                     * if we already joined. We already check that when
                     * looking if the user is a participant in the room,
                     * but better be safe than sorry
                     */
                }
            }
            return api.connect(diceRoom.slug, diceRoom.passcode, diceUser.uuid);
        }
    }
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

export const validateTheme = (t: ITheme) => {
    for (const d of t.available_dice) {
        if (!d.hasOwnProperty("type")) {
            const dice = t.available_dice as Array<IDieType>;
            if (
                dice.includes(IDieType.D4) &&
                dice.includes(IDieType.D6) &&
                dice.includes(IDieType.D8) &&
                dice.includes(IDieType.D10) &&
                dice.includes(IDieType.D12) &&
                dice.includes(IDieType.D20)
            ) {
                return true;
            } else {
                return false;
            }
        }
    }
    const dice = t.available_dice;
    const diceIds = dice.map((d) => {
        d = d as IAvailableDie;
        return d.type;
    });
    return (
        diceIds.includes(IDieType.D4) &&
        diceIds.includes(IDieType.D6) &&
        diceIds.includes(IDieType.D8) &&
        diceIds.includes(IDieType.D10) &&
        diceIds.includes(IDieType.D12) &&
        diceIds.includes(IDieType.D20)
    );
};

export const localRoll = async (
    diceEquation: string,
    label: string,
    addRoll: (entry: RollLogEntryType) => void,
    hidden: boolean = false,
    statblock?: string,
) => {
    try {
        const roll = new DiceRoll(diceEquation.replaceAll(" ", ""));
        const name = await OBR.player.getName();
        const logEntry = {
            uuid: v4(),
            created_at: new Date().toISOString(),
            equation: diceEquation,
            label: label,
            is_hidden: false,
            total_value: String(roll.total),
            username: statblock ?? name,
            values: [roll.output.substring(roll.output.indexOf(":") + 1, roll.output.indexOf("=") - 1)],
            owlbear_user_id: OBR.player.id,
            participantUsername: name,
        };

        if (!hidden) {
            await OBR.broadcast.sendMessage(rollMessageChannel, logEntry, { destination: "REMOTE" });
        }

        await handleNewRoll(addRoll, logEntry);
        rollLogStore.persist.rehydrate();

        return roll;
    } catch {}
};

export const addSpellToRollLog = async (
    label: string,
    addRoll: (entry: RollLogEntryType) => void,
    statblock?: string,
) => {
    const logEntry = {
        uuid: v4(),
        created_at: new Date().toISOString(),
        equation: "",
        label: label,
        is_hidden: false,
        total_value: [],
        username: statblock || "",
        values: [],
        owlbear_user_id: OBR.player.id,
    };

    await OBR.broadcast.sendMessage(rollMessageChannel, logEntry, { destination: "REMOTE" });

    await handleNewRoll(addRoll, logEntry);
    rollLogStore.persist.rehydrate();
};

export const rollWrapper = async (
    api: ThreeDDiceAPI | null,
    dice: Array<IDiceRoll>,
    options?: Partial<IDiceRollOptions>,
) => {
    if (api) {
        try {
            const roll = await api.roll.create(dice, options);
            if (roll && roll.data) {
                return roll.data;
            }
        } catch {
            await OBR.notification.show(
                "Error while rolling dice - check if the selected dice theme is available",
                "WARNING",
            );
            return null;
        }
    }
};

export const getUserUuid = async (room: RoomMetadata | null, rollerApi?: ThreeDDiceAPI) => {
    if (room?.diceRoom?.slug && rollerApi) {
        const participant = await getDiceParticipant(rollerApi, room.diceRoom.slug);

        if (participant) {
            return [participant.id];
        }
    }
    return undefined;
};

export const blastMessage = (message: object) => {
    for (let i = 0; i < window.parent.frames.length; i++) {
        window.parent.frames[i].postMessage(message, "*");
    }
};
