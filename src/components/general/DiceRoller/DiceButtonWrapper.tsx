import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { IDiceRoll, Operator, parseRollEquation } from "dddice-js";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { dddiceRollToRollLog } from "../../../helper/helpers.ts";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import { useRef, useState } from "react";

type DiceButtonProps = {
    dice: string;
    text: string;
    context: string;
};
export const DiceButton = (props: DiceButtonProps) => {
    const { addRoll } = useRollLogContext();
    const { room } = useMetadataContext();
    const { roller } = useDiceRoller();
    const { component } = useComponentContext();
    const [context, setContext] = useState<boolean>(false);
    const rollButton = useRef<HTMLButtonElement>(null);

    const diceToRoll = (diceString: string) => {
        let dice: Array<IDiceRoll> = [];
        let operator: Operator | undefined = undefined;
        if (props.dice.includes("d")) {
            try {
                const parsed = parseRollEquation(diceString, room?.diceTheme || "dddice-standard");
                dice = parsed.dice;
                operator = parsed.operator;
            } catch {
                const split = props.dice.split("d");
                if (split.length === 2) {
                    const amount = parseInt(split[0]);
                    let die = split[1];

                    if (die.includes("+")) {
                        const parts = die.split("+");
                        if (parts.length === 2) {
                            die = parts[0];
                            dice.push({
                                type: "mod",
                                theme: room?.diceTheme || "dddice-standard",
                                value: parseInt(parts[1]),
                            });
                        }
                    }

                    if (die.includes("-")) {
                        const parts = die.split("-");
                        if (parts.length === 2) {
                            die = parts[0];
                            dice.push({
                                type: "mod",
                                theme: room?.diceTheme || "dddice-standard",
                                value: parseInt(parts[1]) * -1,
                            });
                        }
                    }

                    for (let i = 0; i < amount; i++) {
                        dice.splice(0, 0, { type: `d${parseInt(die)}`, theme: room?.diceTheme || "dddice-standard" });
                    }
                }
            }
        } else if (props.dice.startsWith("+") || props.dice.startsWith("-")) {
            dice.push({ type: "d20", theme: room?.diceTheme || "dddice-standard" });
            dice.push({ type: "mod", theme: room?.diceTheme || "dddice-standard", value: parseInt(props.dice) });
        } else {
            console.warn("found dice string that could not be parsed", props.dice);
        }
        return { dice, operator };
    };

    const getUserUuid = async () => {
        if (room?.diceRoom?.slug) {
            const diceRoom = (await roller.api?.room.get(room?.diceRoom.slug))?.data;
            const user = (await roller.api?.user.get())?.data;
            if (user && diceRoom) {
                const participant = diceRoom.participants.find((p) => p.user.uuid === user.uuid);
                if (participant) {
                    return [participant.id];
                }
            }
        }
        return undefined;
    };

    const roll = async (modifier?: "ADV" | "DIS" | "SELF") => {
        const button = rollButton.current;
        if (button) {
            button.classList.add("rolling");
            let parsed: { dice: IDiceRoll[]; operator: Operator | undefined } | undefined;
            if (modifier && modifier === "ADV") {
                parsed = diceToRoll("2d20kh1");
            } else if (modifier && modifier === "DIS") {
                parsed = diceToRoll("2d20dh1");
            } else {
                parsed = diceToRoll(props.dice);
            }
            if (parsed) {
                const roll = await roller.roll(parsed.dice, {
                    label: props.context,
                    operator: parsed.operator,
                    external_id: component,
                    whisper: modifier === "SELF" ? await getUserUuid() : undefined,
                });
                if (roll && roll.data) {
                    const data = roll.data;

                    addRoll(await dddiceRollToRollLog(data));
                }
            }
            button.classList.remove("rolling");
        }
    };

    return (
        <div
            className={`button-wrapper ${roller.api ? "enabled" : "disabled"}`}
            onMouseEnter={() => {
                setContext(true);
            }}
            onMouseLeave={() => setContext(false)}
        >
            <button
                ref={rollButton}
                className={"dice-button button"}
                onClick={async () => {
                    await roll();
                }}
            >
                <DiceSvg />
                {props.text.replace(/\s/g, "")}
            </button>
            <div
                className={`dice-context-button ${context ? "visible" : ""} ${
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
                            onClick={async () => {
                                await roll("ADV");
                            }}
                        >
                            ADV
                        </button>
                        <button
                            className={"disadvantage"}
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

export const DiceButtonWrapper = (text: string, context: string) => {
    const regex = /((\d+?d\d+)( ?[\+\-] ?\d+)?)|([\+\-]\d+)/gi;
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
                    diceField = <DiceButton dice={die} text={text} context={context} />;
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
