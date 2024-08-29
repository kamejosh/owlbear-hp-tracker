import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useCallback, useRef, useState } from "react";
import { diceToRoll, getUserUuid, localRoll, rollWrapper } from "../../../helper/diceHelper.ts";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { parseRollEquation } from "dddice-js";
import { getDiceImage, getSvgForDiceType } from "../../../helper/previewHelpers.tsx";
import { D20 } from "../../svgs/dice/D20.tsx";
import Tippy from "@tippyjs/react";

type DiceButtonProps = {
    dice: string;
    text: string;
    context: string;
    statblock?: string;
    onRoll?: () => void;
    limitReached?: boolean | null;
    damageDie?: boolean;
};
export const DiceButton = (props: DiceButtonProps) => {
    const [room, taSettings] = useMetadataContext((state) => [state.room, state.taSettings]);
    const addRoll = useRollLogContext((state) => state.addRoll);
    const [rollerApi, initialized, theme] = useDiceRoller((state) => [state.rollerApi, state.initialized, state.theme]);
    const [context, setContext] = useState<boolean>(false);
    const rollButton = useRef<HTMLButtonElement>(null);

    const addModifier = (originalDie: string, baseDie: string) => {
        if (originalDie.includes("+")) {
            baseDie += `+${props.dice.split("+").pop()}`;
        }
        if (originalDie.includes("-")) {
            baseDie += `-${props.dice.split("-").pop()}`;
        }
        return baseDie;
    };

    const roll = async (modifier?: "ADV" | "DIS" | "SELF" | "CRIT") => {
        const button = rollButton.current;
        if (button) {
            button.classList.add("rolling");
            let label = props.context;
            let modifiedDice = props.dice;
            if (modifier && modifier === "ADV") {
                modifiedDice = addModifier(props.dice, "2d20kh1");
            } else if (modifier && modifier === "DIS") {
                modifiedDice = addModifier(props.dice, "2d20dh1");
            } else if (modifier && modifier === "CRIT") {
                label = label.substring(0, label.indexOf(":")) + ": Critical Damage";
                const diceCountsRegx = /\d+(?=d\d)/gi;
                const dicesRegx = /(?<=\dd)(\d+)/gi;
                const modifierRegx = /(?<=d\d+( ?))([+-]{1}( ?)\d+)(?!d\d)/gi;
                const diceCounts = modifiedDice.match(diceCountsRegx);
                const dices = modifiedDice.match(dicesRegx);
                const modifiers = modifiedDice.match(modifierRegx);
                try {
                    if (diceCounts && dices && diceCounts.length === dices.length) {
                        if (taSettings.crit_rules === "double_dice") {
                            const diceArray = diceCounts?.map((dc) => `${2 * Number(dc)}d`);
                            modifiedDice = "";
                            diceArray.forEach((dc, index) => {
                                if (index > 0) {
                                    modifiedDice += "+";
                                }
                                modifiedDice += `${dc}${dices[index]}`;
                            });
                        } else if (taSettings.crit_rules === "double_role") {
                            modifiedDice = "2*(";
                            diceCounts.forEach((dc, index) => {
                                if (index > 0) {
                                    modifiedDice += "+";
                                }
                                modifiedDice += `${dc}d${dices[index]}`;
                            });
                            modifiedDice += ")";
                        } else if (taSettings.crit_rules === "max_roll") {
                            modifiedDice = "";
                            diceCounts.forEach((dc, index) => {
                                if (index > 0) {
                                    modifiedDice += "+";
                                }
                                const maxRoll = Number(dc) * Number(dices[index]);
                                modifiedDice += `${dc}d${dices[index]} + ${maxRoll} `;
                            });
                        }

                        if (modifiers) {
                            modifiedDice += " " + modifiers.join(" ");
                        }
                    }
                } catch {}
            }

            if (theme && !room?.disableDiceRoller) {
                const parsed = diceToRoll(modifiedDice, theme.id);
                if (parsed && rollerApi) {
                    try {
                        await rollWrapper(rollerApi, parsed.dice, {
                            label: label,
                            operator: parsed.operator,
                            external_id: props.statblock,
                            whisper: modifier === "SELF" ? await getUserUuid(room, rollerApi) : undefined,
                        });
                    } catch {
                        console.warn("error in dice roll", parsed.dice, parsed.operator);
                    }
                }
            } else {
                await localRoll(modifiedDice, label, addRoll, modifier === "SELF", props.statblock);
            }
            if (props.onRoll) {
                props.onRoll();
            }
            button.classList.remove("rolling");
            button.blur();
        }
    };

    const getDicePreview = () => {
        try {
            const parsed = parseRollEquation(props.dice, "dddice-bees");
            const die = parsed.dice.find((d) => d.type !== "mod");
            if (die) {
                if (room?.disableDiceRoller) {
                    return getSvgForDiceType(die.type);
                } else {
                    if (theme) {
                        const image = getDiceImage(theme, die, 0);
                        return image ?? <D20 />;
                    } else {
                        return <D20 />;
                    }
                }
            } else {
                return <D20 />;
            }
        } catch {
            return <D20 />;
        }
    };

    const isEnabled = useCallback(() => {
        return (initialized && !room?.disableDiceRoller) || room?.disableDiceRoller;
    }, [initialized, room?.disableDiceRoller]);

    return (
        <Tippy
            content={
                !initialized && !room?.disableDiceRoller
                    ? "Dice Roller is not initialized"
                    : props.limitReached
                    ? "You have reached your limits for this ability"
                    : ""
            }
            disabled={!(!initialized && !room?.disableDiceRoller) && !props.limitReached}
        >
            <div
                className={`button-wrapper ${isEnabled() ? "enabled" : "disabled"} ${
                    room?.disableDiceRoller ? "calculated" : "three-d-dice"
                }`}
                onMouseEnter={() => {
                    setContext(true);
                }}
                onMouseLeave={() => setContext(false)}
            >
                <button
                    ref={rollButton}
                    disabled={!isEnabled()}
                    className={`dice-button button ${props.limitReached ? "limit" : ""}`}
                    onClick={async () => {
                        await roll();
                    }}
                >
                    <div className={"dice-preview"}>{getDicePreview()}</div>
                    {props.text.replace(/\s/g, "").replace("&nbsp", " ")}
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
                    {props.damageDie && taSettings.crit_rules !== "none" ? (
                        <button
                            className={"crit"}
                            disabled={!isEnabled()}
                            onClick={async () => {
                                await roll("CRIT");
                            }}
                        >
                            CRIT
                        </button>
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
        </Tippy>
    );
};

export const DiceButtonWrapper = ({
    text,
    context,
    statblock,
    onRoll,
    limitReached,
    damageDie,
}: {
    text: string;
    context: string;
    statblock?: string;
    onRoll?: () => void;
    limitReached?: boolean | null;
    damageDie?: boolean;
}) => {
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
                    } else if (die.startsWith("+") || die.startsWith("-")) {
                        die = `1d20${die}`;
                    }
                    diceField = (
                        <DiceButton
                            dice={die}
                            text={text}
                            context={context}
                            statblock={statblock}
                            onRoll={onRoll}
                            limitReached={limitReached}
                            damageDie={damageDie}
                        />
                    );
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
