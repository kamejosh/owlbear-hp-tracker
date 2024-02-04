import { useEffect, useRef, useState } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { SceneReadyContext } from "../../../context/SceneReadyContext.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { DiceRoom } from "./DiceRoom.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { addRollerApiCallbacks, addRollerCallbacks, dddiceApiLogin, dddiceLogin } from "../../../helper/diceHelper.ts";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import { ThreeDDiceAPI } from "dddice-js";

type DiceTrayProps = {
    classes: string;
    overlay: boolean;
};

export const DiceTray = (props: DiceTrayProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { roller, setRollerApi, setInitialized, theme, setTheme } = useDiceRoller();
    const playerContext = usePlayerContext();
    const { addRoll } = useRollLogContext();
    const { isReady } = SceneReadyContext();
    const { room } = useMetadataContext();
    const { component } = useComponentContext();
    const [apiKey, setApiKey] = useState<string | undefined>();

    useEffect(() => {}, [room?.diceUser]);

    useEffect(() => {
        const newApiKey = room?.diceUser?.find((user) => user.playerId === playerContext.id)?.apiKey;
        if (newApiKey !== undefined && newApiKey !== apiKey) {
            setApiKey(newApiKey);
        } else if (newApiKey === undefined && apiKey === undefined) {
            setApiKey("");
        }
    }, [room]);

    useEffect(() => {
        if (isReady && apiKey !== undefined) {
            initDice(!!room?.diceRendering);
        }
    }, [apiKey]);

    const initDice = async (diceRendering: boolean = true) => {
        let api: ThreeDDiceAPI | undefined = undefined;
        setInitialized(false);
        if (props.overlay && canvasRef.current) {
            const success = await dddiceLogin(room, roller, canvasRef.current);
            if (success) {
                await addRollerCallbacks(roller, addRoll, component);
            }
        } else {
            api = await dddiceApiLogin(room);
            if (api) {
                setRollerApi(api);
                if (!diceRendering) {
                    await addRollerApiCallbacks(api, addRoll, component);
                }
            }
        }

        if (!theme) {
            const themeId = room?.diceUser?.find((user) => user.playerId === playerContext.id)?.diceTheme;
            if (themeId) {
                const newTheme = props.overlay
                    ? (await roller.api?.theme.get(themeId))?.data
                    : (await api?.theme.get(themeId))?.data;
                if (newTheme) {
                    setTheme(newTheme);
                }
            }
        }
        setInitialized(true);
    };

    return (
        <>
            {props.overlay ? (
                <canvas ref={canvasRef} id={"DiceCanvas"} className={props.classes}></canvas>
            ) : (
                <DiceRoom className={props.classes} />
            )}
        </>
    );
};
