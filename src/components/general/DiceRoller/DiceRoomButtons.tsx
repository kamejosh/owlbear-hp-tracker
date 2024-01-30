import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useDiceButtonsContext } from "../../../context/DiceButtonContext.tsx";
import { useEffect, useRef, useState } from "react";
import { IDiceRoll, Operator, parseRollEquation } from "dddice-js";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { AddSvg } from "../../svgs/AddSvg.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { diceToRoll } from "../../../helper/diceHelper.ts";
import { dddiceRollToRollLog } from "../../../helper/helpers.ts";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import tippy from "tippy.js";
import { RollLogSvg } from "../../svgs/RollLogSvg.tsx";

type DiceRoomButtonsProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

type CustomDiceButtonProps = {
    button: number;
    dice: string | null;
};

const CustomDiceButton = (props: CustomDiceButtonProps) => {
    const { roller, theme } = useDiceRoller();
    const { addRoll } = useRollLogContext();
    const { buttons, setButtons } = useDiceButtonsContext();
    const { component } = useComponentContext();
    const [hover, setHover] = useState<boolean>(false);
    const [addCustom, setAddCustom] = useState<boolean>(false);
    const [validCustom, setValidCustom] = useState<boolean>(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (buttonRef.current) {
            tippy(buttonRef.current, {
                content: props.dice || "Add new custom dice roll",
            });
        }
    }, [buttonRef.current]);

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
                                        <span key={index} className={"modifier"}>
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
        <div
            className={`custom-dice-wrapper ${props.dice ? "has-dice" : ""}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <button
                ref={buttonRef}
                className={`button custom-dice dice-${props.button}`}
                onClick={async (e) => {
                    if (!props.dice && buttons.hasOwnProperty(props.button.toString())) {
                        setAddCustom(true);
                    } else if (props.dice) {
                        await roll(e.currentTarget);
                    }
                }}
            >
                {props.dice ? getDicePreview() : <AddSvg />}
            </button>
            {addCustom ? (
                <div className={"add-custom-dice"}>
                    <input
                        disabled={!theme}
                        ref={inputRef}
                        type={"text"}
                        onChange={(e) => {
                            const value = e.currentTarget.value;
                            try {
                                if (theme) {
                                    const parsed = parseRollEquation(value, theme);
                                    if (parsed) {
                                        setValidCustom(true);
                                        inputRef.current?.classList.remove("error");
                                        inputRef.current?.classList.add("success");
                                    }
                                }
                            } catch {
                                setValidCustom(false);
                                inputRef.current?.classList.remove("success");
                                inputRef.current?.classList.add("error");
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && validCustom) {
                                const newButton = {
                                    [props.button]: e.currentTarget.value,
                                };
                                setButtons(newButton);
                                setAddCustom(false);
                                setValidCustom(false);
                            }
                        }}
                    />
                    <button
                        className={"save-custom-dice"}
                        disabled={!validCustom}
                        onClick={() => {
                            if (inputRef.current) {
                                const newButton = {
                                    [props.button]: inputRef.current.value,
                                };
                                setButtons(newButton);
                                setAddCustom(false);
                                setValidCustom(false);
                            }
                        }}
                    >
                        √
                    </button>
                </div>
            ) : null}
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
    const logButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (logButtonRef.current) {
            tippy(logButtonRef.current, {
                content: "open roll log",
            });
        }
    }, [logButtonRef]);

    return (
        <div className={"dice-room-buttons"}>
            {Object.values(buttons).map((value, index) => {
                return <CustomDiceButton key={index} button={index + 1} dice={value} />;
            })}
            <button
                ref={logButtonRef}
                className={`open-dice-tray button icon ${props.open ? "open" : "closed"}`}
                onClick={(e) => {
                    props.setOpen(!props.open);
                    useRollLogContext.persist.rehydrate();
                    e.currentTarget.blur();
                }}
            >
                <RollLogSvg />
            </button>
        </div>
    );
};
