import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useCallback, useEffect, useRef, useState } from "react";
import { diceToRoll, getUserUuid, localRoll, rollWrapper } from "../../../helper/diceHelper.ts";
import tippy, { Instance } from "tippy.js";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";

type DiceButtonProps = {
    dice: string;
    text: string;
    context: string;
    statblock?: string;
};
export const DiceButton = (props: DiceButtonProps) => {
    const room = useMetadataContext((state) => state.room);
    const addRoll = useRollLogContext((state) => state.addRoll);
    const [rollerApi, initialized, theme] = useDiceRoller((state) => [state.rollerApi, state.initialized, state.theme]);
    const [context, setContext] = useState<boolean>(false);
    const [tooltip, setTooltip] = useState<Instance>();
    const rollButton = useRef<HTMLButtonElement>(null);
    const buttonWrapper = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (buttonWrapper.current) {
            if (!tooltip) {
                if (!initialized || !!room?.disableDiceRoller) {
                    setTooltip(
                        tippy(buttonWrapper.current, {
                            content: !!room?.disableDiceRoller
                                ? "dddice is disabled, no 3d dice are rendered"
                                : "Dice Roller is not initialized",
                        })
                    );
                }
            } else {
                if (!initialized || !!room?.disableDiceRoller) {
                    tooltip.enable();
                    tooltip.setContent(
                        !!room?.disableDiceRoller
                            ? "dddice is disabled, no 3d dice are rendered"
                            : "Dice Roller is not initialized"
                    );
                } else {
                    tooltip.disable();
                }
            }
        }
    }, [initialized, room?.disableDiceRoller]);

    const addModifier = (originalDie: string, baseDie: string) => {
        if (originalDie.includes("+")) {
            baseDie += `+${props.dice.split("+").pop()}`;
        }
        if (originalDie.includes("-")) {
            baseDie += `-${props.dice.split("-").pop()}`;
        }
        return baseDie;
    };

    const roll = async (modifier?: "ADV" | "DIS" | "SELF") => {
        const button = rollButton.current;
        if (button) {
            button.classList.add("rolling");
            let modifiedDice = props.dice;
            if (modifier && modifier === "ADV") {
                modifiedDice = addModifier(props.dice, "2d20kh1");
            } else if (modifier && modifier === "DIS") {
                modifiedDice = addModifier(props.dice, "2d20dh1");
            }

            if (theme && !room?.disableDiceRoller) {
                const parsed = diceToRoll(modifiedDice, theme.id);
                if (parsed && rollerApi) {
                    try {
                        await rollWrapper(rollerApi, parsed.dice, {
                            label: props.context,
                            operator: parsed.operator,
                            external_id: props.statblock,
                            whisper: modifier === "SELF" ? await getUserUuid() : undefined,
                        });
                    } catch {
                        console.warn("error in dice roll", parsed.dice, parsed.operator);
                    }
                }
            } else {
                await localRoll(modifiedDice, props.context, addRoll, modifier === "SELF", props.statblock);
            }
            button.classList.remove("rolling");
            button.blur();
        }
    };

    const isEnabled = useCallback(() => {
        return (initialized && !room?.disableDiceRoller) || room?.disableDiceRoller;
    }, [initialized, room?.disableDiceRoller]);

    return (
        <div
            className={`button-wrapper ${isEnabled() ? "enabled" : "disabled"}`}
            onMouseEnter={() => {
                setContext(true);
            }}
            onMouseLeave={() => setContext(false)}
            ref={buttonWrapper}
        >
            <button
                ref={rollButton}
                disabled={!isEnabled()}
                className={"dice-button button"}
                onClick={async () => {
                    await roll();
                }}
            >
                <DiceSvg />
                {props.text.replace(/\s/g, "")}
            </button>
            <div
                className={`dice-context-button ${context && isEnabled() ? "visible" : ""} ${
                    props.dice.startsWith("1d20") ||
                    props.dice.startsWith("d20") ||
                    props.dice.startsWith("+") ||
                    props.dice.startsWith("-")
                        ? "full"
                        : "reduced"
                }`}
            >
                {props.dice.startsWith("1d20") ||
                props.dice.startsWith("d20") ||
                props.dice.startsWith("+") ||
                props.dice.startsWith("-") ? (
                    <>
                        <button
                            className={"advantage"}
                            disabled={!isEnabled()}
                            onClick={async () => {
                                await roll("ADV");
                            }}
                        >
                            ADV
                        </button>
                        <button
                            className={"disadvantage"}
                            disabled={!isEnabled()}
                            onClick={async () => {
                                await roll("DIS");
                            }}
                        >
                            DIS
                        </button>
                    </>
                ) : null}
                <button
                    className={"self"}
                    disabled={!isEnabled()}
                    onClick={async () => {
                        await roll("SELF");
                    }}
                >
                    HIDE
                </button>
            </div>
        </div>
    );
};

export const DiceButtonWrapper = (text: string, context: string, statblock?: string) => {
    const regex = /((\d*?d\d+)( ?[\+\-] ?\d+)?)|([\+\-]\d+)/gi;
    const dice = text.match(regex);
    dice?.forEach((die) => {
        text = text.split(die).join("|||");
    });
    const parts = text.split("|||");

    return (
        <span>
            {parts.map((part, index) => {
                let diceField = null;
                if (dice && dice.length >= index && dice[index]) {
                    let die = dice[index];
                    const text = die;
                    if (die.startsWith("DC")) {
                        die = `1d20>${parseInt(die.substring(3))}`;
                    }
                    diceField = <DiceButton dice={die} text={text} context={context} statblock={statblock} />;
                }
                return (
                    <span key={index}>
                        {part}
                        {diceField}
                    </span>
                );
            })}
        </span>
    );
};
