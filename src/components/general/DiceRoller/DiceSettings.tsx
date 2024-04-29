import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { IAvailableDie, IDieType, ITheme } from "dddice-js";
import { useEffect, useState } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { updateRoomMetadataDiceUser } from "../../../helper/diceHelper.ts";
import OBR from "@owlbear-rodeo/sdk";
import { getRoomDiceUser } from "../../../helper/helpers.ts";
import { diceTrayModal } from "../../../helper/variables.ts";
import { useListThemes } from "../../../api/dddiceApi.ts";
import { Select } from "../Select.tsx";

export const DiceSettings = ({ setSettings }: { setSettings: (settings: boolean) => void }) => {
    const room = useMetadataContext((state) => state.room);
    const { rollerApi, initialized, theme, setTheme } = useDiceRoller();
    const playerContext = usePlayerContext();
    const [validTheme, setValidTheme] = useState<boolean>(true);
    const [searching, setSearching] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const themesQuery = useListThemes(getRoomDiceUser(room, playerContext.id)?.apiKey ?? "");

    const validateTheme = (t: ITheme) => {
        for (const d of t.available_dice) {
            if (d.hasOwnProperty("type")) {
                const die = d as IAvailableDie;
                if (die.notation === "d10x" && (die.notation !== die.id || die.type !== "d10")) {
                    // setError("d100 invalid - does not match die ID or notation");
                    return false;
                } else if (die.notation !== "d10x" && (die.notation !== die.id || die.id !== die.type)) {
                    // setError(`${die.type} invalid - does not match dice ID or notation`);
                    return false;
                }
            } else {
                const dice = t.available_dice as Array<IDieType>;
                if (
                    dice.includes(IDieType.D4) &&
                    dice.includes(IDieType.D6) &&
                    dice.includes(IDieType.D8) &&
                    dice.includes(IDieType.D10) &&
                    dice.includes(IDieType.D12) &&
                    dice.includes(IDieType.D20)
                ) {
                    return true;
                } else {
                    // setError("theme invalid - theme missing required die in proper notation");
                    return false;
                }
            }
        }
        const dice = t.available_dice;
        const diceIds = dice.map((d) => {
            d = d as IAvailableDie;
            return d.type;
        });
        if (
            diceIds.includes(IDieType.D4) &&
            diceIds.includes(IDieType.D6) &&
            diceIds.includes(IDieType.D8) &&
            diceIds.includes(IDieType.D10) &&
            diceIds.includes(IDieType.D12) &&
            diceIds.includes(IDieType.D20)
        ) {
            return true;
        } else {
            // setError("theme invalid - theme missing required die in proper notation");
            return false;
        }
    };

    const themes: Array<ITheme> = themesQuery.isSuccess
        ? themesQuery.data.data.filter((t: ITheme) => validateTheme(t))
        : [];

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
            setError("theme no found");
            setValidTheme(false);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const initTheme = async () => {
            const themeId = getRoomDiceUser(room, playerContext.id)?.diceTheme;
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

    const getThemePreview = (t: ITheme) => {
        if (t?.preview) {
            if (Object.keys(t.preview).includes("d20")) {
                return <img className={"theme-preview"} src={t.preview.d20} alt={"d20 theme preview"} />;
            } else if (Object.keys(t.preview).length > 0) {
                return <img className={"theme-preview"} src={Object.values(t.preview).pop()} alt={"theme preview"} />;
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
                <Select
                    options={themes.map((t) => {
                        return { value: t.id, name: t.name || t.id, icon: getThemePreview(t) };
                    })}
                    current={{
                        value: theme?.id || "",
                        name: theme?.name || "",
                        icon: theme ? getThemePreview(theme) : undefined,
                    }}
                    setTheme={findAndSetTheme}
                />
            </div>
            {error ? <span>{error}</span> : null}
            <div className={"setting dice-rendering"}>
                <span className={"text"}>{"Render 3D Dice "}</span>
                <input
                    type={"checkbox"}
                    checked={getRoomDiceUser(room, playerContext.id)?.diceRendering}
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
