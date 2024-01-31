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
    const { roller, setInitialized, theme, setTheme } = useDiceRoller();
    const playerContext = usePlayerContext();
    const { addRoll } = useRollLogContext();
    const { isReady } = SceneReadyContext();
    const { room } = useMetadataContext();
    const { component } = useComponentContext();
    const [apiKey, setApiKey] = useState<string | undefined>();

    useEffect(() => {
        if (roller) {
            initDice(!!room?.diceRendering);
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
        if (isReady && canvasRef.current) {
            initDice(!!room?.diceRendering);
        }
    }, [isReady, canvasRef, apiKey]);

    const initDice = async (diceRendering: boolean = true) => {
        if (canvasRef.current || !diceRendering) {
            setInitialized(false);
            if (diceRendering && canvasRef.current) {
                await dddiceLogin(room, roller, canvasRef.current);
            } else {
                await dddiceLogin(room, roller);
            }
            await addRollerCallbacks(roller, addRoll, component, room?.diceRendering);
            setInitialized(true);
            if (!theme) {
                const themeId = room?.diceUser?.find((user) => user.playerId === playerContext.id)?.diceTheme;
                if (themeId) {
                    const newTheme = (await roller.api?.theme.get(themeId))?.data;
                    if (newTheme) {
                        setTheme(newTheme);
                    }
                }
            }
        }
    };

    return (
        <>
            <DiceRoom className={classes} />
            <canvas ref={canvasRef} id={"DiceCanvas"} className={classes}></canvas>
        </>
    );
};
