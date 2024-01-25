import { useEffect, useRef } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { SceneReadyContext } from "../../../context/SceneReadyContext.ts";
import { DDDICE_API_KEY } from "../../../config.ts";
import { IRoom, ThreeDDiceRollEvent } from "dddice-js";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { dddiceRollToRollLog, updateRoomMetadata } from "../../../helper/helpers.ts";
import { DiceRoom } from "./DiceRoom.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";

export const DiceTray = ({ classes }: { classes: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { roller } = useDiceRoller();
    const playerContext = usePlayerContext();
    const { addRoll } = useRollLogContext();
    const { isReady } = SceneReadyContext();
    const { room } = useMetadataContext();

    useEffect(() => {
        const initDice = async () => {
            if (!roller.canvas && canvasRef.current) {
                roller.initialize(canvasRef.current, DDDICE_API_KEY, {}, "HP Tracker");

                /*let roomSlug: string | undefined = "";
                if ("com.dddice/roomSlug" in roomMetadata) {
                    // roomSlug = roomMetadata["com.dddice/roomSlug"] as string;
                }
                const roomMetadata = await OBR.room.getMetadata();
                const playerId = await OBR.player.getId();
                let userId: string | undefined = undefined;
                if (`com.dddice/${playerId}` in roomMetadata) {
                    userId = roomMetadata[`com.dddice/${playerId}`] as string;
                }
                */
                let diceRoom: IRoom | undefined = undefined;
                let roomSlug: string | undefined = undefined;

                if (room?.diceRoom === undefined) {
                    diceRoom = (await roller.api?.room.create())?.data;
                    roomSlug = diceRoom?.slug;
                    updateRoomMetadata(room, { diceRoom: roomSlug });
                } else {
                    roomSlug = room.diceRoom;
                }
                roller.start();
                if (roomSlug) {
                    roller.connect(roomSlug);
                    const theme = await roller.api?.theme.get("silvie-lr1gjqod");
                    if (theme) {
                        roller.loadTheme(theme.data);
                    }
                    roller.on(ThreeDDiceRollEvent.RollStarted, async (e) => {
                        if (e.label) {
                            try {
                                const rollLabel = JSON.parse(e.label);
                                if ("user" in rollLabel && rollLabel.user !== playerContext.name) {
                                    addRoll(await dddiceRollToRollLog(e));
                                }
                            } catch {
                                const room = (await roller.api?.room.get(roomSlug!))?.data;
                                addRoll(await dddiceRollToRollLog(e, room?.participants));
                            }
                        }
                    });
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
