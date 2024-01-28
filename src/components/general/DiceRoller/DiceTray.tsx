import { useEffect, useRef } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { SceneReadyContext } from "../../../context/SceneReadyContext.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { DiceRoom } from "./DiceRoom.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { addRollerCallbacks, getApiKey, getDiceRoom, prepareRoomUser } from "../../../helper/diceHelper.ts";
import { useComponentContext } from "../../../context/ComponentContext.tsx";

export const DiceTray = ({ classes }: { classes: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { roller } = useDiceRoller();
    const playerContext = usePlayerContext();
    const { addRoll } = useRollLogContext();
    const { isReady } = SceneReadyContext();
    const { room } = useMetadataContext();
    const { component } = useComponentContext();

    useEffect(() => {
        if (roller) {
            if (!room?.diceRendering) {
                canvasRef.current?.classList.add("hide");
            } else {
                canvasRef.current?.classList.remove("hide");
            }
        }
    }, [room?.diceRendering]);

    useEffect(() => {
        const initDice = async () => {
            if (!roller.canvas && canvasRef.current) {
                roller.initialize(canvasRef.current, await getApiKey(room), {}, "HP Tracker");

                const diceRoom = await getDiceRoom(roller, room);
                if (diceRoom) {
                    const user = (await roller.api?.user.get())?.data;
                    if (user) {
                        const participant = diceRoom.participants.find((p) => p.user.uuid === user.uuid);
                        if (participant) {
                            await prepareRoomUser(diceRoom, roller);
                        } else {
                            try {
                                const userDiceRoom = (await roller?.api?.room.join(diceRoom.slug, diceRoom.passcode))
                                    ?.data;
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
                    await addRollerCallbacks(roller, playerContext.name, addRoll, component);
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
