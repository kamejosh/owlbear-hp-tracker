import { useEffect, useRef, useState } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { SceneReadyContext } from "../../../context/SceneReadyContext.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { DiceRoom } from "./DiceRoom.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { addRollerCallbacks, dddiceLogin } from "../../../helper/diceHelper.ts";
import { useComponentContext } from "../../../context/ComponentContext.tsx";

export const DiceTray = ({ classes }: { classes: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { roller, setInitialized } = useDiceRoller();
    const playerContext = usePlayerContext();
    const { addRoll } = useRollLogContext();
    const { isReady } = SceneReadyContext();
    const { room } = useMetadataContext();
    const { component } = useComponentContext();
    const [apiKey, setApiKey] = useState<string | undefined>();

    useEffect(() => {
        if (roller) {
            if (!room?.diceRendering) {
                canvasRef.current?.classList.add("hide");
            } else {
                canvasRef.current?.classList.remove("hide");
            }
        }
    }, [room?.diceRendering]);

    useEffect(() => {}, [room?.diceUser]);

    useEffect(() => {
        const newApiKey = room?.diceUser?.find((user) => user.playerId === playerContext.id)?.apiKey;
        if (newApiKey && newApiKey !== apiKey) {
            setApiKey(newApiKey);
        }
    }, [room]);

    useEffect(() => {
        const initDice = async () => {
            if (canvasRef.current) {
                setInitialized(false);
                await dddiceLogin(room, roller, canvasRef.current);
                await addRollerCallbacks(roller, addRoll, component);
                setInitialized(true);
            }
        };

        if (isReady && canvasRef.current) {
            initDice();
        }
    }, [isReady, canvasRef, apiKey]);

    return (
        <>
            <DiceRoom className={classes} />
            <canvas ref={canvasRef} id={"DiceCanvas"} className={classes}></canvas>
        </>
    );
};
