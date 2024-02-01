import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateRoomMetadata } from "../../../helper/helpers.ts";
import { IAvailableDie, IDieType, ITheme } from "dddice-js";
import { useCallback, useEffect, useState } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { updateRoomMetadataDiceUser } from "../../../helper/diceHelper.ts";

export const DiceSettings = ({ setSettings }: { setSettings: (settings: boolean) => void }) => {
    const { room } = useMetadataContext();
    const { roller, initialized, theme, setTheme } = useDiceRoller();
    const playerContext = usePlayerContext();
    const [validTheme, setValidTheme] = useState<boolean>(true);
    const [searching, setSearching] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const validateTheme = useCallback((t: ITheme) => {
        for (const d of t.available_dice) {
            if (d.hasOwnProperty("type")) {
                const die = d as IAvailableDie;
                if (die.notation === "d10x" && (die.notation !== die.id || die.type !== "d10")) {
                    setError("d100 invalid - does not match die ID or notation");
                    return false;
                } else if (die.notation !== "d10x" && (die.notation !== die.id || die.id !== die.type)) {
                    setError(`${die.type} invalid - does not match dice ID or notation`);
                    return false;
                }
            } else {
                const dice = t.available_dice as Array<IDieType>;
                if (
                    dice.includes(IDieType.D20) &&
                    dice.includes(IDieType.D4) &&
                    dice.includes(IDieType.D6) &&
                    dice.includes(IDieType.D8) &&
                    dice.includes(IDieType.D10) &&
                    dice.includes(IDieType.D12) &&
                    dice.includes(IDieType.D20) &&
                    dice.includes(IDieType.D10X)
                ) {
                    return true;
                } else {
                    setError("theme invalid - theme missing required die in proper notation");
                    return false;
                }
            }
        }
        return true;
    }, []);

    const findAndSetTheme = async (searchTheme: string, input?: HTMLInputElement) => {
        try {
            setSearching(true);
            const newTheme = (await roller.api?.theme.get(searchTheme))?.data;

            if (newTheme && validateTheme(newTheme)) {
                if (newTheme.id !== theme?.id) {
                    if (room && playerContext.id) {
                        await updateRoomMetadataDiceUser(room, playerContext.id, { diceTheme: newTheme.id });
                        roller.loadTheme(newTheme);
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

    useEffect(() => {
        if (error) {
            setTimeout(() => {
                setError(null);
            }, 5000);
        }
    }, [error]);

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
            <button
                className={"close-button"}
                onClick={() => {
                    setSettings(false);
                }}
            >
                X
            </button>
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
            {error ? <span>{error}</span> : null}
            <div className={"setting dice-rendering"}>
                <span className={"text"}>
                    {"Render 3D Dice "}
                    <span className={"small"}>(requires restart)</span>:
                </span>
                <input
                    type={"checkbox"}
                    checked={room?.diceRendering}
                    onChange={async () => {
                        await updateRoomMetadata(room, { diceRendering: !room?.diceRendering });
                    }}
                />
            </div>
        </div>
    );
};
