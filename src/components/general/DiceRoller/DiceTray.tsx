import { useEffect, useState } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { DiceRoom } from "./DiceRoom.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import {
    connectToDddiceRoom,
    dddiceApiLogin,
    getDiceUser,
    updateRoomMetadataDiceUser,
} from "../../../helper/diceHelper.ts";
import { IRoom, ITheme, IUser, ThreeDDiceAPI } from "dddice-js";
import { DiceUser } from "../../../helper/types.ts";
import { getRoomDiceUser } from "../../../helper/helpers.ts";
import { useListRooms, useListThemes } from "../../../api/dddiceApi.ts";
import OBR from "@owlbear-rodeo/sdk";
import { isNull } from "lodash";
import { useShallow } from "zustand/react/shallow";

type DiceTrayProps = {
    classes: string;
};

export const DiceTray = (props: DiceTrayProps) => {
    const [rollerApi, setRollerApi, setInitialized, theme, setTheme, themes, setThemes, rooms, setRooms] =
        useDiceRoller(
            useShallow((state) => [
                state.rollerApi,
                state.setRollerApi,
                state.setInitialized,
                state.theme,
                state.setTheme,
                state.themes,
                state.setThemes,
                state.rooms,
                state.setRooms,
            ]),
        );
    const playerContext = usePlayerContext();
    const room = useMetadataContext(useShallow((state) => state.room));
    const [diceUser, setDiceUser] = useState<DiceUser>();
    const [apiKey, setApiKey] = useState<string>();
    const [roomSlug, setRoomSlug] = useState<string>();
    const [dddiceUser, setDddiceUser] = useState<IUser>();

    const diceThemeQuery = useListThemes(diceUser?.apiKey || "");

    const roomsQuery = useListRooms(diceUser?.apiKey || "");

    useEffect(() => {
        if (playerContext.role === "GM") {
            if (rooms.length === 0) {
                if (roomsQuery.hasNextPage && !roomsQuery.isFetchingNextPage) {
                    roomsQuery.fetchNextPage();
                } else if (!roomsQuery.hasNextPage && roomsQuery.isSuccess) {
                    const dddiceRooms: Array<IRoom> = roomsQuery.isSuccess
                        ? roomsQuery.data.pages.flatMap((room) => room.data)
                        : [];
                    setRooms(dddiceRooms);
                }
            }
        }
    }, [roomsQuery.hasNextPage, roomsQuery.isFetchingNextPage, roomsQuery.isSuccess]);

    useEffect(() => {
        if (isNull(themes)) {
            if (diceThemeQuery.hasNextPage && !diceThemeQuery.isFetchingNextPage) {
                diceThemeQuery.fetchNextPage();
            } else if (!diceThemeQuery.hasNextPage && diceThemeQuery.isSuccess) {
                const diceThemes: Array<ITheme> = diceThemeQuery.isSuccess
                    ? diceThemeQuery.data.pages.flatMap((theme) => theme.data)
                    : [];
                setThemes(diceThemes);
            }
        }
    }, [diceThemeQuery.hasNextPage, diceThemeQuery.isFetchingNextPage, diceThemeQuery.isSuccess]);

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
        const initDice = async () => {
            let api: ThreeDDiceAPI | undefined;
            setInitialized(false);
            if (diceUser?.apiKey !== apiKey && diceUser?.apiKey !== undefined) {
                setApiKey(diceUser?.apiKey);
                setRoomSlug(room?.diceRoom?.slug);
                api = await dddiceApiLogin(room, dddiceUser);
                if (api) {
                    setRollerApi(api);
                    setDddiceUser(await getDiceUser(api));
                }
            }

            setInitialized(true);
        };

        if ((diceUser && diceUser.apiKey !== undefined) || !diceUser) {
            if (!room?.disableDiceRoller && diceUser?.apiKey) {
                initDice();
            }
        }

        if (rollerApi && room?.diceRoom?.slug && room?.diceRoom?.slug !== roomSlug) {
            setRoomSlug(room.diceRoom.slug);
            connectToDddiceRoom(rollerApi, room, dddiceUser);
        }
    }, [diceUser, room?.disableDiceRoller, room?.diceRoom?.slug]);

    useEffect(() => {
        const resetDiceTheme = async () => {
            if (!isNull(themes) && themes.length > 0) {
                setTheme(themes[0]);
                if (room) {
                    await updateRoomMetadataDiceUser(room, OBR.player.id, { diceTheme: themes[0].id });
                }
            } else {
                const newTheme = (await rollerApi?.theme.get("dddice-bees"))?.data;
                if (newTheme) {
                    setTheme(newTheme);
                    if (room) {
                        await updateRoomMetadataDiceUser(room, OBR.player.id, { diceTheme: newTheme.id });
                    }
                }
            }
        };
        const initUserTheme = async () => {
            if (!theme) {
                const themeId = room?.diceUser?.find((user) => user.playerId === playerContext.id)?.diceTheme;
                if (themeId && !isNull(themes) && themes.map((t) => t.id).includes(themeId)) {
                    const newTheme = (await rollerApi?.theme.get(themeId))?.data;
                    if (newTheme) {
                        setTheme(newTheme);
                    }
                } else {
                    await resetDiceTheme();
                }
            } else {
                if (!isNull(themes) && !themes.includes(theme)) {
                    await resetDiceTheme();
                }
            }
        };

        if (rollerApi && !isNull(themes)) {
            initUserTheme();
        }
    }, [rollerApi, diceThemeQuery.isSuccess, diceUser?.diceTheme, themes]);

    return <DiceRoom className={props.classes} user={dddiceUser} />;
};
