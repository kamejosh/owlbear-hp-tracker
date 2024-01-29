import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useDiceButtonsContext } from "../../../context/DiceButtonContext.tsx";
import { useEffect, useState } from "react";
import { IDiceRoll, ITheme, Operator, parseRollEquation } from "dddice-js";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { AddSvg } from "../../svgs/AddSvg.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { diceToRoll } from "../../../helper/diceHelper.ts";
import { dddiceRollToRollLog } from "../../../helper/helpers.ts";
import { useComponentContext } from "../../../context/ComponentContext.tsx";

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
    const { addRoll } = useRollLogContext();
    const { buttons, setButtons } = useDiceButtonsContext();
    const [theme, setTheme] = useState<ITheme | null>(null);
    const { component } = useComponentContext();
    const playerContext = usePlayerContext();
    const [hover, setHover] = useState<boolean>(false);

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
    }, [initialized, room]);

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

    const roll = async (button: HTMLButtonElement) => {
        button.classList.add("rolling");
        if (theme && props.dice) {
            let parsed: { dice: IDiceRoll[]; operator: Operator | undefined } | undefined = diceToRoll(
                props.dice,
                theme.id
            );
            if (parsed) {
                const roll = await roller.roll(parsed.dice, {
                    operator: parsed.operator,
                    external_id: component,
                });
                if (roll && roll.data) {
                    const data = roll.data;
                    addRoll(await dddiceRollToRollLog(data));
                }
            }
        }
        button.classList.remove("rolling");
        button.blur();
    };

    return (
        <div className={"custom-dice-wrapper"} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
            <button
                className={`button custom-dice dice-${props.button}`}
                onClick={async (e) => {
                    if (!props.dice && buttons.hasOwnProperty(props.button.toString())) {
                        const newButton = {
                            [props.button]: "1d4 2d6",
                        };
                        setButtons(newButton);
                    } else if (props.dice) {
                        await roll(e.currentTarget);
                    }
                }}
            >
                {props.dice ? getDicePreview() : <AddSvg />}
            </button>
            {props.dice ? (
                <button
                    className={`remove-dice ${hover ? "hover" : ""}`}
                    onClick={() => {
                        if (props.dice && buttons.hasOwnProperty(props.button.toString())) {
                            const newButton = {
                                [props.button]: null,
                            };
                            setButtons(newButton);
                        }
                    }}
                >
                    x
                </button>
            ) : null}
        </div>
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
