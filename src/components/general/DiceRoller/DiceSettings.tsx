import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useEffect, useState } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { updateRoomMetadataDiceRoom, updateRoomMetadataDiceUser, validateTheme } from "../../../helper/diceHelper.ts";
import OBR from "@owlbear-rodeo/sdk";
import { getRoomDiceUser } from "../../../helper/helpers.ts";
import { diceTrayModal } from "../../../helper/variables.ts";
import { Select } from "../Select.tsx";
import { getThemePreview } from "../../../helper/previewHelpers.tsx";
import { Loader } from "../Loader.tsx";
import { isNull } from "lodash";

export const DiceSettings = ({ setSettings }: { setSettings: (settings: boolean) => void }) => {
    const room = useMetadataContext((state) => state.room);
    const [rollerApi, theme, setTheme, themes, rooms] = useDiceRoller((state) => [
        state.rollerApi,
        state.theme,
        state.setTheme,
        state.themes,
        state.rooms,
    ]);
    const playerContext = usePlayerContext();
    const [validTheme, setValidTheme] = useState<boolean>(true);
    const [searching, setSearching] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const currentRoom = rooms.find((r) => r.slug === room?.diceRoom?.slug);

    const findAndSetTheme = async (searchTheme: string, input?: HTMLInputElement) => {
        try {
            setSearching(true);
            const newTheme = (await rollerApi?.theme.get(searchTheme))?.data;

            if (newTheme && validateTheme(newTheme)) {
                if (newTheme.id !== theme?.id) {
                    if (room && playerContext.id) {
                        await updateRoomMetadataDiceUser(room, playerContext.id, { diceTheme: newTheme.id });
                        setValidTheme(true);
                        setTheme(newTheme);
                    } else {
                        if (input) {
                            input.value = theme?.id || "";
                        }
                        setError("error updating theme");
                        setValidTheme(false);
                    }
                }
            } else {
                setValidTheme(false);
            }
        } catch {
            if (input) {
                input.value = theme?.id || "";
            }
            setError("theme not found");
            setValidTheme(false);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        if (error) {
            setTimeout(() => {
                setError(null);
            }, 5000);
        }
    }, [error]);

    return (
        <div className={"dice-settings"}>
            <button
                className={"close-button"}
                onClick={() => {
                    setSettings(false);
                }}
            >
                X
            </button>
            <div className={`setting dice-theme ${validTheme ? "valid" : "invalid"} ${searching ? "searching" : ""}`}>
                <span className={"setting-name"}>dice theme:</span>
                {theme ? (
                    <Select
                        options={
                            !isNull(themes)
                                ? themes.map((t) => {
                                      return { value: t.id, name: t.name || t.id, icon: getThemePreview(t) };
                                  })
                                : []
                        }
                        current={{
                            value: theme.id,
                            name: theme.name!,
                            icon: getThemePreview(theme),
                        }}
                        setTheme={findAndSetTheme}
                    />
                ) : (
                    <Loader className={"theme-loader"} />
                )}
            </div>
            {error ? <span>{error}</span> : null}
            {playerContext.role === "GM" ? (
                <div className={`setting dice-room-select valid`}>
                    <span className={"setting-name"}>dice room:</span>
                    {rooms.length === 0 && !currentRoom ? (
                        <Loader className={"room-loader"} />
                    ) : (
                        <Select
                            options={rooms.map((r) => {
                                return { value: r.slug, name: `${r.name} - ${r.slug}` };
                            })}
                            current={
                                currentRoom
                                    ? { value: currentRoom.slug, name: `${currentRoom.name} - ${currentRoom.slug}` }
                                    : undefined
                            }
                            setTheme={async (t) => {
                                if (room) {
                                    await updateRoomMetadataDiceRoom(room, t);
                                }
                            }}
                        />
                    )}
                </div>
            ) : null}
            <div className={"setting dice-rendering"}>
                <span className={"text"}>{"Render 3D Dice "}</span>
                <input
                    type={"checkbox"}
                    checked={getRoomDiceUser(room, playerContext.id)?.diceRendering ?? true}
                    onChange={async () => {
                        if (room) {
                            const id = OBR.player.id;
                            const diceRendering = getRoomDiceUser(room, id)?.diceRendering;
                            await updateRoomMetadataDiceUser(room, id, { diceRendering: !diceRendering });
                            if (!diceRendering) {
                                await OBR.modal.open(diceTrayModal);
                            }
                        }
                    }}
                />
            </div>
        </div>
    );
};
