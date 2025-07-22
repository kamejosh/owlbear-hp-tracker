import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useCallback, useState } from "react";
import { diceToRoll, getUserUuid, localRoll, rollWrapper } from "../../../helper/diceHelper.ts";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { IRoll, parseRollEquation } from "dddice-js";
import { getDiceImage, getSvgForDiceType } from "../../../helper/previewHelpers.tsx";
import { D20 } from "../../svgs/dice/D20.tsx";
import Tippy from "@tippyjs/react";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useShallow } from "zustand/react/shallow";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./dice-button-wrapper.scss";
import { isNull, isUndefined, startsWith, toNumber } from "lodash";
import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import { autoPlacement, safePolygon, useFloating, useHover, useInteractions } from "@floating-ui/react";
import remarkBreaks from "remark-breaks";

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
    onRoll?: (rollResult?: IRoll | DiceRoll | null) => void;
    limitReached?: boolean | null;
    damageDie?: boolean;
    proficiencyBonus?: number | null;
    classes?: string;
};
export const DiceButton = (props: DiceButtonProps) => {
    const [room, taSettings] = useMetadataContext(useShallow((state) => [state.room, state.taSettings]));
    const addRoll = useRollLogContext(useShallow((state) => state.addRoll));
    const [rollerApi, initialized, theme] = useDiceRoller(
        useShallow((state) => [state.rollerApi, state.initialized, state.theme]),
    );
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const playerContext = usePlayerContext();
    const defaultHidden = playerContext.role === "GM" && !!taSettings.gm_rolls_hidden;

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            autoPlacement({
                autoAlignment: true,
                crossAxis: true,
                allowedPlacements: ["left", "right"],
            }),
        ],
    });

    const hover = useHover(context, { handleClose: safePolygon() });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    const replaceStatWithMod = (text: string) => {
        if (room?.ruleset === "e5" && text.includes("PB")) {
            if (!isUndefined(props.proficiencyBonus) && !isNull(props.proficiencyBonus)) {
                text = text.replace("PB", props.proficiencyBonus.toString());
            } else {
                text = text.replace("PB", "0");
            }
        }
        if (room?.ruleset === "e5" && text.includes("SCM")) {
            text = text.replace(
                "SCM",
                Math.floor(
                    (Math.max(props.stats.intelligence, props.stats.wisdom, props.stats.charisma) - 10) / 2,
                ).toString(),
            );
        }
        if (text.includes("STR")) {
            text = text.replace(
                "STR",
                (room?.ruleset === "pf"
                    ? props.stats.strength
                    : Math.floor((props.stats.strength - 10) / 2)
                ).toString(),
            );
        }
        if (text.includes("DEX")) {
            text = text.replace(
                "DEX",
                (room?.ruleset === "pf"
                    ? props.stats.dexterity
                    : Math.floor((props.stats.dexterity - 10) / 2)
                ).toString(),
            );
        }
        if (text.includes("CON")) {
            text = text.replace(
                "CON",
                (room?.ruleset === "pf"
                    ? props.stats.constitution
                    : Math.floor((props.stats.constitution - 10) / 2)
                ).toString(),
            );
        }
        if (text.includes("INT")) {
            text = text.replace(
                "INT",
                (room?.ruleset === "pf"
                    ? props.stats.intelligence
                    : Math.floor((props.stats.intelligence - 10) / 2)
                ).toString(),
            );
        }
        if (text.includes("WIS")) {
            text = text.replace(
                "WIS",
                (room?.ruleset === "pf" ? props.stats.wisdom : Math.floor((props.stats.wisdom - 10) / 2)).toString(),
            );
        }
        if (text.includes("CHA")) {
            text = text.replace(
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
        const button = refs.domReference.current;
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
                const diceCounts: Array<string> = [];
                const dices: Array<string> = [];
                const diceRegx = /(?:\d+)?d\d+/gi;
                const modifierRegx = /(?<=[d\d\s])([+-]\s*\d+)(?!\s*d\d)/gi;
                const fullDice = modifiedDice.match(diceRegx);
                fullDice?.forEach((fullDie) => {
                    const parts = fullDie.split("d");
                    if (parts.length === 2) {
                        diceCounts.push(parts[0] === "" ? "1" : parts[0]);
                        dices.push(parts[1]);
                    } else {
                        diceCounts.push("1");
                        dices.push(parts[0]);
                    }
                });
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
                        } else if (taSettings.crit_rules === "savage_roll") {
                            modifiedDice = "2*(";
                            diceCounts.forEach((dc, index) => {
                                if (index > 0) {
                                    modifiedDice += "+";
                                }
                                modifiedDice += `${toNumber(dc) * 2}d${dices[index]}kh${dc}`;
                            });
                            modifiedDice += ")";
                        }

                        if (modifiers) {
                            modifiedDice += " " + modifiers.join(" ");
                        }
                    }
                } catch (e) {
                    console.error(e);
                }
            }

            let rollResult = null;
            if (theme && !room?.disableDiceRoller) {
                const parsed = diceToRoll(modifiedDice, theme.id);
                if (parsed && rollerApi) {
                    try {
                        rollResult = await rollWrapper(rollerApi, parsed.dice, {
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
                rollResult = await localRoll(modifiedDice, label, addRoll, modifier === "SELF", props.statblock);
            }
            if (props.onRoll) {
                props.onRoll(rollResult);
            }
            button.classList.remove("rolling");
            try {
                (button as HTMLElement).blur();
            } catch {}
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
                className={`button-wrapper ${props.classes} ${isEnabled() ? "enabled" : "disabled"} ${
                    room?.disableDiceRoller ? "calculated" : "three-d-dice"
                }`}
                onMouseEnter={() => {
                    setIsOpen(true);
                }}
                onMouseLeave={() => setIsOpen(false)}
            >
                <button
                    ref={refs.setReference}
                    {...getReferenceProps()}
                    disabled={!isEnabled()}
                    className={`dice-button button ${props.limitReached ? "limit" : ""}`}
                    onClick={async () => {
                        await roll(defaultHidden ? "SELF" : undefined);
                    }}
                >
                    <div className={"dice-preview"}>{getDicePreview()}</div>
                    {text.replace(/\s/g, "").replace("&nbsp", " ")}
                </button>
                {isOpen && isEnabled ? (
                    <span
                        ref={refs.setFloating}
                        {...getFloatingProps()}
                        style={floatingStyles}
                        className={`dice-context-button visible ${
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
                ) : null}
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
    proficiencyBonus,
}: {
    text: string;
    context: string;
    statblock?: string;
    stats: Stats;
    onRoll?: () => void;
    limitReached?: boolean | null;
    damageDie?: boolean;
    proficiencyBonus?: number | null;
}) => {
    const regex = /`?((\d*?d\d+)(( ?[\+\-] ?((\d+)|([A-Z]{3})))?)|( [\+\-]\d+))`?/g;
    const dice = text.match(regex);
    if (dice) {
        const diceCopy = Array.from(dice);
        diceCopy?.forEach((die) => {
            if (!die.startsWith("`")) {
                const diceSplitter = new RegExp("(?<!`)" + die.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?!`)");
                text = text.split(diceSplitter).join("|||");
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
                                proficiencyBonus={proficiencyBonus}
                            />
                        );
                    }
                }

                return (
                    <div key={index} className={"dice-button-wrapper-part"} style={{ paddingRight: "0.5ch" }}>
                        <Markdown
                            className={"inline-markdown"}
                            remarkPlugins={[remarkGfm, remarkBreaks]}
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
                                                    dice={props.children?.toString() || ""}
                                                    text={props.children?.toString() || ""}
                                                    context={context}
                                                    stats={stats}
                                                    statblock={statblock}
                                                    onRoll={onRoll}
                                                    limitReached={limitReached}
                                                    damageDie={damageDie}
                                                    proficiencyBonus={proficiencyBonus}
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
