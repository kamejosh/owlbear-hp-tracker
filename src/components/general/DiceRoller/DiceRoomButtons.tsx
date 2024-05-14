import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useDiceButtonsContext } from "../../../context/DiceButtonContext.tsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { IAvailableDie, IDiceRoll, IDieType, Operator, parseRollEquation } from "dddice-js";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { AddSvg } from "../../svgs/AddSvg.tsx";
import { diceToRoll, getDiceParticipant, localRoll, rollWrapper } from "../../../helper/diceHelper.ts";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import tippy, { Instance } from "tippy.js";
import { RollLogSvg } from "../../svgs/RollLogSvg.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
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
    const [rollerApi, theme, initialized] = useDiceRoller((state) => [state.rollerApi, state.theme, state.initialized]);
    const addRoll = useRollLogContext((state) => state.addRoll);
    const { buttons, setButtons } = useDiceButtonsContext();
    const room = useMetadataContext((state) => state.room);
    const component = useComponentContext((state) => state.component);
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
        if (!room?.disableDiceRoller && rollerApi && theme && props.dice) {
            let parsed: { dice: IDiceRoll[]; operator: Operator | undefined } | undefined = diceToRoll(
                props.dice,
                theme.id
            );
            if (parsed) {
                await rollWrapper(rollerApi, parsed.dice, {
                    operator: parsed.operator,
                    external_id: component,
                    label: "Roll: Custom",
                });
            }
        } else if (props.dice) {
            await localRoll(props.dice, "Roll: Custom", addRoll);
        }
        button.classList.remove("rolling");
        button.blur();
    };

    const isEnabled = useCallback(() => {
        return (initialized && !room?.disableDiceRoller) || room?.disableDiceRoller;
    }, [initialized, room?.disableDiceRoller]);

    return (
        <div
            className={`custom-dice-wrapper ${props.dice ? "has-dice" : ""}`}
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
        >
            <button
                ref={buttonRef}
                className={`button custom-dice dice-${props.button} ${isEnabled() ? "enabled" : "disabled"} `}
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
                            } else if (e.key === "Escape") {
                                setAddCustom(false);
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
                    <button
                        className={"abort-custom-dice"}
                        onClick={() => {
                            setAddCustom(false);
                        }}
                    >
                        X
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
    const { theme, rollerApi } = useDiceRoller();
    const { room } = useMetadataContext();
    const { component } = useComponentContext();
    const [validCustom, setValidCustom] = useState<boolean>(true);

    const getUserUuid = async () => {
        if (room?.diceRoom?.slug && rollerApi) {
            const participant = await getDiceParticipant(rollerApi, room.diceRoom.slug);

            if (participant) {
                return [participant.id];
            }
        }
        return undefined;
    };

    const roll = async (element: HTMLElement, dice: string, hide: boolean = false) => {
        element.classList.add("rolling");
        if (theme && dice) {
            let parsed: { dice: IDiceRoll[]; operator: Operator | undefined } | undefined = diceToRoll(dice, theme.id);
            if (parsed && rollerApi) {
                await rollWrapper(rollerApi, parsed.dice, {
                    operator: parsed.operator,
                    external_id: component,
                    label: "Roll: Custom",
                    whisper: hide ? await getUserUuid() : undefined,
                });
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
                                        ref={(e) => {
                                            if (e) {
                                                tippy(e, { content: name });
                                            }
                                        }}
                                    >
                                        <img src={preview} alt={name} />
                                        <button
                                            className={"self"}
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (e.currentTarget.parentElement) {
                                                    await roll(e.currentTarget.parentElement, name, true);
                                                }
                                            }}
                                        >
                                            SELF
                                        </button>
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
                                e.currentTarget.style.width = `${e.currentTarget.value.length}ch`;
                                if (e.currentTarget.value === "") {
                                    setValidCustom(true);
                                    return;
                                }
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
                            onKeyDown={async (e) => {
                                if (e.key === "Enter" && validCustom && e.currentTarget.value) {
                                    await roll(e.currentTarget, e.currentTarget.value);
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
            <div className={`quick-button-wrapper`}>
                <QuickButtons open={quick} />
                <button
                    onClick={() => setQuick(!quick)}
                    className={`quick-roll-button button icon ${quick ? "open" : ""}`}
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
