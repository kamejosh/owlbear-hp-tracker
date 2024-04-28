import { useEffect, useState } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { DiceRoom } from "./DiceRoom.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { dddiceApiLogin } from "../../../helper/diceHelper.ts";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import { ThreeDDiceAPI } from "dddice-js";
import { DiceUser } from "../../../helper/types.ts";
import { getRoomDiceUser } from "../../../helper/helpers.ts";

type DiceTrayProps = {
    classes: string;
};

export const DiceTray = (props: DiceTrayProps) => {
    const [setRollerApi, setInitialized, theme, setTheme] = useDiceRoller((state) => [
        state.setRollerApi,
        state.setInitialized,
        state.theme,
        state.setTheme,
    ]);
    const playerContext = usePlayerContext();
    const room = useMetadataContext((state) => state.room);
    const component = useComponentContext((state) => state.component);
    const [diceUser, setDiceUser] = useState<DiceUser>();

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
        if ((diceUser && diceUser.apiKey !== undefined) || (!diceUser && component === "modal")) {
            if (!room?.disableDiceRoller && diceUser?.apiKey) {
                initDice();
            }
        }
    }, [diceUser, room?.disableDiceRoller]);

    const initDice = async () => {
        setInitialized(false);
        const api: ThreeDDiceAPI | undefined = await dddiceApiLogin(room);
        if (api) {
            setRollerApi(api);
        }
        if (!theme) {
            const themeId = room?.diceUser?.find((user) => user.playerId === playerContext.id)?.diceTheme;
            if (themeId) {
                const newTheme = (await api?.theme.get(themeId))?.data;
                if (newTheme) {
                    setTheme(newTheme);
                }
            }
        }
        setInitialized(true);
    };

    return <DiceRoom className={props.classes} />;
};
