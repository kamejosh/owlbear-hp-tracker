import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useDiceButtonsContext } from "../../../context/DiceButtonContext.tsx";
import { useEffect, useState } from "react";
import { ITheme, parseRollEquation } from "dddice-js";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { AddSvg } from "../../svgs/AddSvg.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";

type DiceRoomButtonsProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

type CustomDiceButtonProps = {
    button: number;
    dice: string | null;
};

const CustomDiceButton = (props: CustomDiceButtonProps) => {
    const { roller, initialized } = useDiceRoller();
    const { room } = useMetadataContext();
    const { buttons, setButtons } = useDiceButtonsContext();
    const [theme, setTheme] = useState<ITheme | null>(null);
    const playerContext = usePlayerContext();

    useEffect(() => {
        const loadTheme = async () => {
            const themeId = room?.diceUser?.find((user) => user.playerId === playerContext.id)?.diceTheme;
            if (themeId) {
                const newTheme = (await roller.api?.theme.get(themeId))?.data;
                if (newTheme && newTheme.id !== theme?.id) {
                    setTheme(newTheme);
                }
            }
        };
        if (initialized) {
            loadTheme();
        }
    }, [initialized]);

    console.log(props.dice);

    const getDicePreview = () => {
        if (props.dice && theme) {
            try {
                const parsed = parseRollEquation(props.dice, theme.id);
                return (
                    <div className={"custom-dice-preview-wrapper"}>
                        {parsed.dice.map((die, index) => {
                            if (die.type !== "mod" && theme.preview.hasOwnProperty(die.type)) {
                                return (
                                    <img
                                        key={index}
                                        className={"preview-image"}
                                        src={theme.preview[die.type]}
                                        alt={die.type}
                                    />
                                );
                            } else {
                                if (die.value) {
                                    return (
                                        <span key={index}>
                                            {Intl.NumberFormat("en-US", { signDisplay: "always" }).format(die.value)}
                                        </span>
                                    );
                                }
                            }
                        })}
                    </div>
                );
            } catch {
                return <DiceSvg />;
            }
        }
        return <DiceSvg />;
    };

    return (
        <button
            className={`button custom-dice dice-${props.button}`}
            onClick={() => {
                if (!props.dice && buttons.hasOwnProperty(props.button.toString())) {
                    const newButton = {
                        [props.button]: "1d4 2d6",
                    };
                    setButtons(newButton);
                }
            }}
        >
            {props.dice ? getDicePreview() : <AddSvg />}
        </button>
    );
};

export const DiceRoomButtons = (props: DiceRoomButtonsProps) => {
    const { buttons } = useDiceButtonsContext();

    return (
        <div className={"dice-room-buttons"}>
            {Object.values(buttons).map((value, index) => {
                return <CustomDiceButton key={index} button={index + 1} dice={value} />;
            })}
            <button
                className={`open-dice-tray button icon ${props.open ? "open" : "closed"}`}
                onClick={(e) => {
                    props.setOpen(!props.open);
                    useRollLogContext.persist.rehydrate();
                    e.currentTarget.blur();
                }}
            >
                <DiceSvg />
            </button>
        </div>
    );
};
