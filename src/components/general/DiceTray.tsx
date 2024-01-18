import { useEffect, useRef } from "react";
import { useDiceRoller } from "../../context/DDDiceContext.tsx";
import OBR from "@owlbear-rodeo/sdk";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { DDDICE_API_KEY } from "../../config.ts";
import { IRoom } from "dddice-js";

export const DiceTray = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { roller } = useDiceRoller();
    const { isReady } = SceneReadyContext();

    useEffect(() => {
        const initDice = async () => {
            if (!roller.canvas && canvasRef.current) {
                roller.initialize(canvasRef.current, DDDICE_API_KEY, {}, "HP Tracker");
                const roomMetadata = await OBR.room.getMetadata();
                const playerId = await OBR.player.getId();
                let roomSlug: string | undefined = "";
                let userId: string | undefined = undefined;
                let room: IRoom | undefined = undefined;
                if ("com.dddice/roomSlug" in roomMetadata) {
                    roomSlug = roomMetadata["com.dddice/roomSlug"] as string;
                }
                if (`com.dddice/${playerId}` in roomMetadata) {
                    userId = roomMetadata[`com.dddice/${playerId}`] as string;
                }
                if (roomSlug === "") {
                    room = (await roller.api?.room.create())?.data;
                    roomSlug = room?.slug;
                }
                roller.start();
                if (roomSlug) {
                    roller.connect(roomSlug, undefined, userId);
                }

                console.log(roller.canvas?.width, roller.canvas?.height);
            }
        };

        if (isReady && canvasRef.current) {
            initDice();
        }
    }, [isReady, canvasRef]);

    return <canvas ref={canvasRef} id={"DiceCanvas"}></canvas>;
};
