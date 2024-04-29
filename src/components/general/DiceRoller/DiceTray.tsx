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
    const [rollerApi, setRollerApi, setInitialized, theme, setTheme] = useDiceRoller((state) => [
        state.rollerApi,
        state.setRollerApi,
        state.setInitialized,
        state.theme,
        state.setTheme,
    ]);
    const playerContext = usePlayerContext();
    const room = useMetadataContext((state) => state.room);
    const component = useComponentContext((state) => state.component);
    const [diceUser, setDiceUser] = useState<DiceUser>();
    const [apiKey, setApiKey] = useState<string>();

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

    useEffect(() => {
        const initTheme = async () => {
            if (!theme) {
                const themeId = room?.diceUser?.find((user) => user.playerId === playerContext.id)?.diceTheme;
                if (themeId) {
                    const newTheme = (await rollerApi?.theme.get(themeId))?.data;
                    if (newTheme) {
                        setTheme(newTheme);
                    }
                }
            }
        };

        initTheme();
    }, [rollerApi]);

    const initDice = async () => {
        let api: ThreeDDiceAPI | undefined;
        setInitialized(false);
        if (diceUser?.apiKey !== apiKey && diceUser?.apiKey !== undefined) {
            setApiKey(diceUser?.apiKey);
            api = await dddiceApiLogin(room);
            if (api) {
                setRollerApi(api);
            }
        }

        setInitialized(true);
    };

    return room?.disableDiceRoller ? null : <DiceRoom className={props.classes} />;
};
