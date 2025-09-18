import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useCallback, useMemo, useState } from "react";
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
import { isNull, isUndefined, toNumber } from "lodash";
import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import { autoPlacement, safePolygon, useFloating, useHover, useInteractions } from "@floating-ui/react";
import remarkBreaks from "remark-breaks";
import { useComponentContext } from "../../../context/ComponentContext.tsx";

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
    customDiceThemeId?: string;
};
export const DiceButton = (props: DiceButtonProps) => {
    const { component } = useComponentContext();
    const [room, taSettings] = useMetadataContext(useShallow((state) => [state.room, state.taSettings]));
    const addRoll = useRollLogContext(useShallow((state) => state.addRoll));
    const [rollerApi, initialized, theme, themes] = useDiceRoller(
        useShallow((state) => [state.rollerApi, state.initialized, state.theme, state.themes]),
    );
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const playerContext = usePlayerContext();
    const defaultHidden = playerContext.role === "GM" && !!taSettings.gm_rolls_hidden;

    const customTheme = useMemo(() => {
        if (props.customDiceThemeId) {
            const foundTheme = themes?.find((t) => t.id === props.customDiceThemeId);
            if (foundTheme) {
                return foundTheme;
            }
        }
        return theme;
    }, [props.customDiceThemeId, theme, themes]);

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
            if (customTheme && !room?.disableDiceRoller) {
                const parsed = diceToRoll(modifiedDice, customTheme.id);
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
                    if (customTheme) {
                        const image = getDiceImage(customTheme, die.type, 0);
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
        return (initialized && !room?.disableDiceRoller) || room?.disableDiceRoller || component === "popover";
    }, [initialized, room?.disableDiceRoller, component]);

    return (
        <Tippy
            content={
                !initialized && !room?.disableDiceRoller && component !== "popover"
                    ? "Dice Roller is not initialized"
                    : props.limitReached
                      ? "You have reached your limits for this ability"
                      : props.text
            }
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

const wrapDiceWithBackticks = (input: string): string => {
    // Match full dice expressions OR standalone modifiers like +1/-2
    // const diceRegex = /\d+d\d+(?:\s*[+\-]\s*(?:\d+d\d+|\d+|[A-Za-z]{2,3}))*|[+\-]\d+/g;
    const diceRegex =
        /(?:\d+d\d+|[A-Z]{2,3}d\d+|[A-Z]{2,3})(?:\s*[+\-]\s*(?:\d+d\d+|[A-Z]{2,3}d\d+|[A-Z]{2,3}|\d+))*|\b[+\-]\d+\b|[+\-]\d+/g;
    // Split into code spans and non-code spans. Keep code spans in the result.
    // This also captures fenced blocks ```...``` so we don't touch them.
    const splitRe = /(```[\s\S]*?```|`[^`]*`)/g;

    return input
        .split(splitRe)
        .map((part) => {
            // If this is a code span or fenced block, leave unchanged
            if (!part) return part;
            if (part.startsWith("`") && part.endsWith("`")) return part;

            // Non-code: wrap matches with backticks
            return part.replace(diceRegex, (m) => `\`${m}\``);
        })
        .join("");
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
    const processed = useMemo(() => wrapDiceWithBackticks(text), [text]);
    return (
        <div className={"dice-button-wrapper"}>
            <div className={"dice-button-wrapper-part"} style={{ paddingRight: "0.5ch" }}>
                <Markdown
                    className={"inline-markdown"}
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                        p: ({ node, ...props }) => {
                            return <p style={{ paddingRight: "0.5ch" }}>{props.children}</p>;
                        },
                        code: ({ node, ...props }) => {
                            try {
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
                            } catch {}
                        },
                    }}
                >
                    {processed}
                </Markdown>
            </div>
        </div>
    );
};
