import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateRoomMetadata } from "../../../helper/helpers.ts";
import { IAvailableDie, ITheme } from "dddice-js";
import { useEffect, useState } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { updateRoomMetadataDiceUser } from "../../../helper/diceHelper.ts";
import { has } from "lodash";

export const DiceSettings = () => {
    const { room } = useMetadataContext();
    const { roller, initialized } = useDiceRoller();
    const playerContext = usePlayerContext();
    const [validTheme, setValidTheme] = useState<boolean>(true);
    const [theme, setTheme] = useState<ITheme>();
    const [searching, setSearching] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const findAndSetTheme = async (searchTheme: string, input?: HTMLInputElement) => {
        try {
            setSearching(true);
            const newTheme = (await roller.api?.theme.get(searchTheme))?.data;
            const hasD20 = !!newTheme?.available_dice.find((die) => {
                try {
                    const d = die as IAvailableDie;
                    return d.id === "d20";
                } catch {
                    return false;
                }
            });
            if (!hasD20) {
                if (input) {
                    input.value = theme?.id || "";
                }
                setError("d20 not available");
                setValidTheme(false);
            } else {
                if (newTheme && newTheme.id !== theme?.id) {
                    if (room && playerContext.id) {
                        await updateRoomMetadataDiceUser(room, playerContext.id, { diceTheme: newTheme.id });
                        roller.loadTheme(newTheme);
                        setValidTheme(true);
                        setTheme(newTheme);
                    }
                } else {
                    if (input) {
                        input.value = theme?.id || "";
                    }
                    setError("error updating theme");
                    setValidTheme(false);
                }
            }
        } catch {
            if (input) {
                input.value = theme?.id || "";
            }
            setError("theme no found");
            setValidTheme(false);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const initTheme = async () => {
            const themeId = room?.diceUser?.find((user) => user.playerId === playerContext.id)?.diceTheme;
            if (themeId) {
                await findAndSetTheme(themeId);
            }
        };

        if (initialized) {
            initTheme();
        }
    }, [initialized]);

    const getThemePreview = () => {
        if (theme?.preview) {
            if (Object.keys(theme.preview).includes("d20")) {
                return <img className={"theme-preview"} src={theme.preview.d20} alt={"d20 theme preview"} />;
            } else if (Object.keys(theme.preview).length > 0) {
                return (
                    <img className={"theme-preview"} src={Object.values(theme.preview).pop()} alt={"theme preview"} />
                );
            }
        }
        return <img className={"theme-preview"} src={""} alt={"no preview available"} />;
    };

    return (
        <div className={"dice-settings"}>
            <div className={"setting dice-rendering"}>
                Render 3D Dice:
                <input
                    type={"checkbox"}
                    checked={room?.diceRendering}
                    onChange={async () => {
                        await updateRoomMetadata(room, { diceRendering: !room?.diceRendering });
                    }}
                />
            </div>
            <div className={`setting dice-theme ${validTheme ? "valid" : "invalid"} ${searching ? "searching" : ""}`}>
                dice theme:
                <input
                    className={"theme-input"}
                    type={"text"}
                    defaultValue={room?.diceUser?.find((user) => user.playerId === playerContext.id)?.diceTheme}
                    onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                            await findAndSetTheme(e.currentTarget.value, e.currentTarget);
                        }
                    }}
                    onBlur={async (e) => {
                        await findAndSetTheme(e.currentTarget.value, e.currentTarget);
                    }}
                />
                {theme ? getThemePreview() : null}
            </div>
        </div>
    );
};
