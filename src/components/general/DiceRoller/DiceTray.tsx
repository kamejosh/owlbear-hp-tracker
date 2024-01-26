import { useEffect, useRef } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { SceneReadyContext } from "../../../context/SceneReadyContext.ts";
import { IRoom, ThreeDDiceAPI, ThreeDDiceRollEvent } from "dddice-js";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { dddiceRollToRollLog, updateRoomMetadata } from "../../../helper/helpers.ts";
import { DiceRoom } from "./DiceRoom.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { RoomMetadata } from "../../../helper/types.ts";

const updateRoomMetadataApiKey = async (room: RoomMetadata, apiKey: string, playerId: string) => {
    const diceUser: Array<{ playerId: string; apiKey: string; lastUse: number }> =
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

const updateRoomMetadataDiceRoom = async (room: RoomMetadata, diceRoom: IRoom) => {
    const tempRoom: { slug: string } = {
        slug: diceRoom?.slug || "",
    };
    await updateRoomMetadata(room, {
        diceRoom: {
            ...tempRoom,
        },
    });

    // to keep in sync with dddice I save the dddice metadata as well (Approved by CelesteBloodreign)
    const dddiceMetadata: Metadata = {};
    dddiceMetadata["com.dddice/roomSlug"] = tempRoom.slug;
    await OBR.room.setMetadata({ ...dddiceMetadata });
};

export const DiceTray = ({ classes }: { classes: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const api = useRef<ThreeDDiceAPI>(new ThreeDDiceAPI());
    const { roller } = useDiceRoller();
    const playerContext = usePlayerContext();
    const { addRoll } = useRollLogContext();
    const { isReady } = SceneReadyContext();
    const { room } = useMetadataContext();

    useEffect(() => {
        const getApiKey = async () => {
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

            console.log("api-key", apiKey);
            return apiKey;
        };

        const getDiceRoom = async (): Promise<IRoom | undefined> => {
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
                    await updateRoomMetadataDiceRoom(room, diceRoom);
                }

                return diceRoom;
            } else {
                const diceRoom = (await roller?.api?.room.get(slug))?.data;

                if (room && diceRoom) {
                    await updateRoomMetadataDiceRoom(room, diceRoom);
                }

                return diceRoom;
            }
        };

        const prepareRoomUser = async (diceRoom: IRoom) => {
            const user = (await roller.api?.user.get())?.data;
            console.log("api-user", user);
            if (user) {
                const participant = diceRoom.participants.find((p) => p.user.uuid === user.uuid);

                console.log("room-participant", participant);

                if (participant && playerContext.name && participant.username !== playerContext.name) {
                    await roller.api?.room.updateParticipant(diceRoom.slug, participant.id, {
                        username: playerContext.name,
                    });
                }
            }
        };

        const addRollerCallbacks = async () => {
            roller.on(ThreeDDiceRollEvent.RollStarted, async (e) => {
                if (e.label) {
                    try {
                        const rollLabel = JSON.parse(e.label);
                        if ("user" in rollLabel && rollLabel.user !== playerContext.name) {
                            addRoll(await dddiceRollToRollLog(e));
                        }
                    } catch {
                        let dddiceRoom: IRoom | undefined = undefined;
                        if (room && room.diceRoom && room.diceRoom.slug) {
                            dddiceRoom = (await roller.api?.room.get(room?.diceRoom?.slug))?.data;
                        }
                        addRoll(await dddiceRollToRollLog(e, dddiceRoom?.participants || []));
                    }
                }
            });
        };

        const initDice = async () => {
            if (!roller.canvas && canvasRef.current) {
                console.log("hp-tracker-room-metadata", room);

                roller.initialize(canvasRef.current, await getApiKey(), {}, "HP Tracker");

                const diceRoom = await getDiceRoom();
                console.log("dddice-room", diceRoom);

                if (diceRoom) {
                    roller.connect(diceRoom.slug, diceRoom.passcode);
                    api.current?.room.join(diceRoom.slug, diceRoom.passcode);
                    roller.start();

                    await prepareRoomUser(diceRoom);
                    const theme = await roller.api?.theme.get("silvie-lr1gjqod");
                    if (theme) {
                        roller.loadTheme(theme.data);
                    }

                    await addRollerCallbacks();
                }
            }
        };

        if (isReady && canvasRef.current) {
            initDice();
        }
    }, [isReady, canvasRef]);

    return (
        <>
            <canvas ref={canvasRef} id={"DiceCanvas"} className={classes}></canvas>
            <DiceRoom className={classes} />
        </>
    );
};
