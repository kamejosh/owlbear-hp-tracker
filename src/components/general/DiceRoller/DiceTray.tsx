import { useEffect, useRef } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { SceneReadyContext } from "../../../context/SceneReadyContext.ts";
import { IRoom, ThreeDDiceAPI, ThreeDDiceRollEvent } from "dddice-js";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { dddiceRollToRollLog } from "../../../helper/helpers.ts";
import { DiceRoom } from "./DiceRoom.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import { updateRoomMetadataApiKey, updateRoomMetadataDiceRoom } from "../../../helper/diceHelper.ts";

export const DiceTray = ({ classes }: { classes: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
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

        const prepareRoomUser = async (diceRoom: IRoom) => {
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

        const addRollerCallbacks = async () => {
            roller.on(ThreeDDiceRollEvent.RollStarted, async (e) => {
                const participant = e.room.participants.find((p) => p.user.uuid === e.user.uuid);

                if (participant && participant.username !== playerContext.name) {
                    addRoll(await dddiceRollToRollLog(e, participant));
                }
            });
        };

        const initDice = async () => {
            if (!roller.canvas && canvasRef.current) {
                roller.initialize(canvasRef.current, await getApiKey(), {}, "HP Tracker");

                const diceRoom = await getDiceRoom();
                if (diceRoom) {
                    try {
                        const userDiceRoom = (await roller?.api?.room.join(diceRoom.slug, diceRoom.passcode))?.data;
                        if (userDiceRoom) {
                            await prepareRoomUser(userDiceRoom);
                        }
                    } catch {
                        // if we already joined it fails and we can take the default room
                        await prepareRoomUser(diceRoom);
                    }

                    roller.connect(diceRoom.slug, diceRoom.passcode);
                    roller.start();
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
