import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useCallback, useRef, useState } from "react";
import { diceToRoll, getUserUuid, localRoll, rollWrapper } from "../../../helper/diceHelper.ts";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { parseRollEquation } from "dddice-js";
import { getDiceImage, getSvgForDiceType } from "../../../helper/previewHelpers.tsx";
import { D20 } from "../../svgs/dice/D20.tsx";
import Tippy from "@tippyjs/react";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useShallow } from "zustand/react/shallow";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./dice-button-wrapper.scss";
import { startsWith } from "lodash";

export type Stats = {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
};

type DiceButtonProps = {
    dice: string;
    text: string;
    context: string;
    stats: Stats;
    statblock?: string;
    onRoll?: () => void;
    limitReached?: boolean | null;
    damageDie?: boolean;
};
export const DiceButton = (props: DiceButtonProps) => {
    const [room, taSettings] = useMetadataContext(useShallow((state) => [state.room, state.taSettings]));
    const addRoll = useRollLogContext(useShallow((state) => state.addRoll));
    const [rollerApi, initialized, theme] = useDiceRoller(
        useShallow((state) => [state.rollerApi, state.initialized, state.theme]),
    );
    const [context, setContext] = useState<boolean>(false);
    const rollButton = useRef<HTMLButtonElement>(null);
    const playerContext = usePlayerContext();
    const defaultHidden = playerContext.role === "GM" && !!taSettings.gm_rolls_hidden;

    const replaceStatWithMod = (text: string) => {
        if (text.includes("STR")) {
            return text.replace(
                "STR",
                (room?.ruleset === "pf"
                    ? props.stats.strength
                    : Math.floor((props.stats.strength - 10) / 2)
                ).toString(),
            );
        } else if (text.endsWith("DEX")) {
            return text.replace(
                "DEX",
                (room?.ruleset === "pf"
                    ? props.stats.dexterity
                    : Math.floor((props.stats.dexterity - 10) / 2)
                ).toString(),
            );
        } else if (text.endsWith("CON")) {
            return text.replace(
                "CON",
                (room?.ruleset === "pf"
                    ? props.stats.constitution
                    : Math.floor((props.stats.constitution - 10) / 2)
                ).toString(),
            );
        } else if (text.endsWith("INT")) {
            return text.replace(
                "INT",
                (room?.ruleset === "pf"
                    ? props.stats.intelligence
                    : Math.floor((props.stats.intelligence - 10) / 2)
                ).toString(),
            );
        } else if (text.endsWith("WIS")) {
            return text.replace(
                "WIS",
                (room?.ruleset === "pf" ? props.stats.wisdom : Math.floor((props.stats.wisdom - 10) / 2)).toString(),
            );
        } else if (text.endsWith("CHA")) {
            return text.replace(
                "CHA",
                (room?.ruleset === "pf"
                    ? props.stats.charisma
                    : Math.floor((props.stats.charisma - 10) / 2)
                ).toString(),
            );
        }
        return text;
    };

    const dice = replaceStatWithMod(props.dice);
    const text = replaceStatWithMod(props.text);

    const addModifier = (originalDie: string, baseDie: string) => {
        if (originalDie.includes("+")) {
            baseDie += `+${dice.split("+").pop()}`;
        }
        if (originalDie.includes("-")) {
            baseDie += `-${dice.split("-").pop()}`;
        }
        return baseDie;
    };

    const roll = async (modifier?: "ADV" | "DIS" | "SELF" | "CRIT") => {
        const button = rollButton.current;
        if (button) {
            button.classList.add("rolling");
            let label = props.context;
            let modifiedDice = dice;
            if (modifier && modifier === "ADV") {
                modifiedDice = addModifier(dice, "2d20kh1");
            } else if (modifier && modifier === "DIS") {
                modifiedDice = addModifier(dice, "2d20dh1");
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
            const parsed = parseRollEquation(dice, "dddice-bees");
            const die = parsed.dice.find((d) => d.type !== "mod");
            if (die) {
                if (room?.disableDiceRoller) {
                    return getSvgForDiceType(die.type);
                } else {
                    if (theme) {
                        const image = getDiceImage(theme, die.type, 0);
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
            <span
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
                        await roll(defaultHidden ? "SELF" : undefined);
                    }}
                >
                    <div className={"dice-preview"}>{getDicePreview()}</div>
                    {text.replace(/\s/g, "").replace("&nbsp", " ")}
                </button>
                <span
                    className={`dice-context-button ${context && isEnabled() ? "visible" : ""} ${
                        dice.startsWith("1d20") ||
                        dice.startsWith("d20") ||
                        dice.startsWith("+") ||
                        dice.startsWith("-")
                            ? "full"
                            : "reduced"
                    }`}
                >
                    {dice.startsWith("1d20") ||
                    dice.startsWith("d20") ||
                    dice.startsWith("+") ||
                    dice.startsWith("-") ? (
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
                            await roll(defaultHidden ? undefined : "SELF");
                        }}
                    >
                        {defaultHidden ? "SHOW" : "HIDE"}
                    </button>
                </span>
            </span>
        </Tippy>
    );
};

export const DiceButtonWrapper = ({
    text,
    context,
    statblock,
    stats,
    onRoll,
    limitReached,
    damageDie,
}: {
    text: string;
    context: string;
    statblock?: string;
    stats: Stats;
    onRoll?: () => void;
    limitReached?: boolean | null;
    damageDie?: boolean;
}) => {
    const regex = /`?((\d*?d\d+)(( ?[\+\-] ?((\d+)|([A-Z]{3})))?)|( [\+\-]\d+))`?/gi;
    const dice = text.match(regex);
    if (dice) {
        const diceCopy = Array.from(dice);
        diceCopy?.forEach((die) => {
            if (!die.startsWith("`")) {
                text = text.split(die).join("|||");
            } else {
                dice.splice(
                    dice.findIndex((d) => d === die),
                    1,
                );
            }
        });
    }
    const parts = text.split("|||");

    return (
        <div className={"dice-button-wrapper"}>
            {parts.map((part, index) => {
                let diceField = null;
                if (dice && dice.length >= index && dice[index]) {
                    if (startsWith(dice[index], "`")) {
                        part += dice[index];
                    } else {
                        let die = dice[index];
                        const text = die.replace(" ", "");
                        if (text.startsWith("DC")) {
                            die = `1d20>${parseInt(die.substring(3))}`;
                        } else if (text.startsWith("+") || text.startsWith("-")) {
                            die = `1d20${die}`;
                        }
                        diceField = (
                            <DiceButton
                                dice={die}
                                text={text}
                                context={context}
                                stats={stats}
                                statblock={statblock}
                                onRoll={onRoll}
                                limitReached={limitReached}
                                damageDie={damageDie}
                            />
                        );
                    }
                }

                return (
                    <div key={index} className={"dice-button-wrapper-part"} style={{ paddingRight: "0.5ch" }}>
                        <Markdown
                            className={"inline-markdown"}
                            remarkPlugins={[remarkGfm]}
                            components={{
                                p: ({ node, ...props }) => {
                                    return <p style={{ paddingRight: "0.5ch" }}>{props.children}</p>;
                                },
                                code: ({ node, ...props }) => {
                                    try {
                                        const diceMatches = String(props.children).match(regex);
                                        if (diceMatches) {
                                            return (
                                                <DiceButton
                                                    dice={diceMatches[0]}
                                                    text={diceMatches[0]}
                                                    context={context}
                                                    stats={stats}
                                                    statblock={statblock}
                                                    onRoll={onRoll}
                                                    limitReached={limitReached}
                                                    damageDie={damageDie}
                                                />
                                            );
                                        }
                                    } catch {}
                                },
                            }}
                        >
                            {part}
                        </Markdown>
                        {diceField}
                    </div>
                );
            })}
        </div>
    );
};
