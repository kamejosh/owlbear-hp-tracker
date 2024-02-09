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
import { DiceUser } from "../../../helper/types.ts";
import { getRoomDiceUser } from "../../../helper/helpers.ts";
import { diceTrayModalId } from "../../../helper/variables.ts";
import OBR from "@owlbear-rodeo/sdk";

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
    const [diceUser, setDiceUser] = useState<DiceUser>();

    useEffect(() => {}, [room?.diceUser]);

    useEffect(() => {
        const newDiceUser = getRoomDiceUser(room, playerContext.id);
        if (newDiceUser) {
            const newApiKey = newDiceUser.apiKey;
            const diceRendering = newDiceUser.diceRendering;

            if (diceUser) {
                if (
                    (newApiKey !== undefined && newApiKey !== diceUser.apiKey) ||
                    diceRendering !== diceUser.diceRendering
                ) {
                    setDiceUser({ ...newDiceUser });
                }
            } else {
                setDiceUser({ ...newDiceUser });
            }
        }
    }, [room]);

    useEffect(() => {
        if (isReady && ((diceUser && diceUser.apiKey !== undefined) || !diceUser)) {
            //when turning off dice rendering we need to close the modal
            if (props.overlay && diceUser && (!diceUser.diceRendering || !!room?.disableDiceRoller)) {
                OBR.modal.close(diceTrayModalId);
            } else if (!room?.disableDiceRoller) {
                initDice((diceUser && diceUser.diceRendering) || true);
            }
        }
    }, [diceUser, room?.disableDiceRoller]);

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
            {room?.disableDiceRoller ? null : props.overlay ? (
                <canvas ref={canvasRef} id={"DiceCanvas"} className={props.classes}></canvas>
            ) : (
                <DiceRoom className={props.classes} />
            )}
        </>
    );
};
