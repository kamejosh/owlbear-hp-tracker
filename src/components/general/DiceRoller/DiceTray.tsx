import { useEffect, useRef } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { SceneReadyContext } from "../../../context/SceneReadyContext.ts";
import { DDDICE_API_KEY } from "../../../config.ts";
import { IRoom } from "dddice-js";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateRoomMetadata } from "../../../helper/helpers.ts";
import { DiceRoom } from "./DiceRoom.tsx";

export const DiceTray = ({ classes }: { classes: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { roller } = useDiceRoller();
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
