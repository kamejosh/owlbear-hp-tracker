import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useDiceButtonsContext } from "../../../context/DiceButtonContext.tsx";
import { useEffect, useRef, useState } from "react";
import { IAvailableDie, IDiceRoll, IDieType, Operator, parseRollEquation } from "dddice-js";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { AddSvg } from "../../svgs/AddSvg.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { diceToRoll } from "../../../helper/diceHelper.ts";
import { dddiceRollToRollLog } from "../../../helper/helpers.ts";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import tippy, { Instance } from "tippy.js";
import { RollLogSvg } from "../../svgs/RollLogSvg.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import OBR from "@owlbear-rodeo/sdk";

type DiceRoomButtonsProps = {
    open: boolean;
    setOpen: (open: boolean) => void;
};

type CustomDiceButtonProps = {
    button: number;
    dice: string | null;
};

const CustomDiceButton = (props: CustomDiceButtonProps) => {
    const { roller, theme, initialized } = useDiceRoller();
    const { addRoll } = useRollLogContext();
    const { buttons, setButtons } = useDiceButtonsContext();
    const { component } = useComponentContext();
    const playerContext = usePlayerContext();
    const [hover, setHover] = useState<boolean>(false);
    const [addCustom, setAddCustom] = useState<boolean>(false);
    const [validCustom, setValidCustom] = useState<boolean>(false);
    const [tippyInstance, setTippyInstance] = useState<Instance>();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (buttonRef.current) {
            if (!tippyInstance) {
                setTippyInstance(
                    tippy(buttonRef.current, {
                        content: props.dice || "Add new custom dice roll",
                    })
                );
            } else {
                tippyInstance.setContent(props.dice || "Add new custom dice roll");
            }
        }
    }, [props.dice]);

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
                    label: "Roll: Custom",
                });
                if (roll && roll.data) {
                    const data = roll.data;
                    addRoll(await dddiceRollToRollLog(data, { owlbear_user_id: playerContext.id || undefined }));
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
                className={`button custom-dice dice-${props.button} ${initialized ? "enabled" : "disabled"} `}
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

const QuickButtons = ({ open }: { open: boolean }) => {
    const { theme, roller } = useDiceRoller();
    const { addRoll } = useRollLogContext();
    const { component } = useComponentContext();
    const [validCustom, setValidCustom] = useState<boolean>();

    const roll = async (element: HTMLElement, dice: string) => {
        element.classList.add("rolling");
        if (theme && dice) {
            let parsed: { dice: IDiceRoll[]; operator: Operator | undefined } | undefined = diceToRoll(dice, theme.id);
            if (parsed) {
                const roll = await roller.roll(parsed.dice, {
                    operator: parsed.operator,
                    external_id: component,
                    label: "Roll: Custom",
                });
                if (roll && roll.data) {
                    const data = roll.data;
                    addRoll(await dddiceRollToRollLog(data, { owlbear_user_id: OBR.player.id || undefined }));
                }
            }
        }
        element.classList.remove("rolling");
        element.blur();
    };

    return (
        <>
            {theme ? (
                <ul className={`quick-button-list ${open ? "open" : ""}`}>
                    {theme.available_dice.map((die, index) => {
                        let preview = "";
                        let name = "";
                        try {
                            if (die.hasOwnProperty("type")) {
                                const notation = (die as IAvailableDie).notation;
                                if (notation && theme.preview.hasOwnProperty(notation)) {
                                    preview = theme.preview[notation];
                                } else {
                                    preview = theme.preview[(die as IAvailableDie).type];
                                }
                                name = (die as IAvailableDie).notation ?? (die as IAvailableDie).id;
                            } else {
                                preview = theme.preview[die as IDieType];
                                name = die.toString();
                            }
                            if (preview && name) {
                                name = name === "d10x" ? "d100" : name;
                                return (
                                    <li
                                        key={index}
                                        className={"quick-roll"}
                                        onClick={async (e) => {
                                            await roll(e.currentTarget, name);
                                        }}
                                        onLoad={(e) => {
                                            tippy(e.currentTarget, { content: name });
                                        }}
                                    >
                                        <img src={preview} alt={name} />
                                    </li>
                                );
                            }
                        } catch {
                            return null;
                        }
                    })}
                    <li className={"quick-custom-roll"}>
                        <DiceSvg />
                        <input
                            className={`quick-custom-input ${validCustom ? "valid" : "invalid"}`}
                            type={"text"}
                            size={2}
                            onChange={(e) => {
                                try {
                                    const parsed = parseRollEquation(e.currentTarget.value, theme.id);
                                    if (parsed) {
                                        setValidCustom(true);
                                    } else {
                                        setValidCustom(false);
                                    }
                                } catch {
                                    setValidCustom(false);
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && validCustom) {
                                    roll(e.currentTarget, e.currentTarget.value);
                                }
                            }}
                        />
                    </li>
                </ul>
            ) : null}
        </>
    );
};

export const DiceRoomButtons = (props: DiceRoomButtonsProps) => {
    const { buttons } = useDiceButtonsContext();
    const [quick, setQuick] = useState<boolean>(false);

    return (
        <div className={"dice-room-buttons"}>
            {Object.values(buttons).map((value, index) => {
                return <CustomDiceButton key={index} button={index + 1} dice={value} />;
            })}
            <button
                className={`open-dice-tray button icon ${props.open ? "open" : "closed"}`}
                ref={(e) => {
                    if (e) {
                        tippy(e, { content: "Log & Settings" });
                    }
                }}
                onClick={(e) => {
                    props.setOpen(!props.open);
                    e.currentTarget.blur();
                }}
            >
                <RollLogSvg />
            </button>
            <div className={"quick-button-wrapper"}>
                <QuickButtons open={quick} />
                <button
                    onClick={() => setQuick(!quick)}
                    className={"quick-roll-button button icon"}
                    ref={(e) => {
                        if (e) {
                            tippy(e, { content: "Quick roll" });
                        }
                    }}
                >
                    <DiceSvg />
                </button>
            </div>
        </div>
    );
};
