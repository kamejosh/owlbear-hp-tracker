import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateRoomMetadata } from "../../../helper/helpers.ts";
import { ITheme } from "dddice-js";
import { useEffect, useState } from "react";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";

export const DiceSettings = () => {
    const { room } = useMetadataContext();
    const { roller } = useDiceRoller();
    const [validTheme, setValidTheme] = useState<boolean>(true);
    const [theme, setTheme] = useState<ITheme>();
    const [searching, setSearching] = useState<boolean>(false);

    const findAndSetTheme = async (searchTheme: string, input?: HTMLInputElement) => {
        try {
            setSearching(true);
            const newTheme = (await roller.api?.theme.get(searchTheme))?.data;
            if (newTheme && newTheme.id !== theme?.id) {
                await updateRoomMetadata(room, { diceTheme: newTheme.id });
                setValidTheme(true);
                setTheme(newTheme);
            }
        } catch {
            if (input) {
                input.value = theme?.id || "";
            }
            setValidTheme(false);
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        const initTheme = async () => {
            if (room?.diceTheme) {
                await findAndSetTheme(room.diceTheme);
            }
        };

        if (roller.api) {
            initTheme();
        }
    }, [roller.api, room?.diceTheme]);

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
                    defaultValue={room?.diceTheme}
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
