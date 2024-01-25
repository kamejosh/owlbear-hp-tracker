import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { IDiceRoll, Operator, parseRollEquation } from "dddice-js";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";

type DiceButtonProps = {
    dice: string;
    text: string;
    context: string;
};
export const DiceButton = (props: DiceButtonProps) => {
    const { addRoll } = useRollLogContext();
    const { room } = useMetadataContext();
    const { roller } = useDiceRoller();
    const playerContext = usePlayerContext();

    const diceToRoll = () => {
        let dice: Array<IDiceRoll> = [];
        let operator: Operator | undefined = undefined;
        let context: string | null = null;
        if (props.dice.includes("d")) {
            try {
                const parsed = parseRollEquation(props.dice, room?.diceTheme || "dddice-standard");
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

                    if (die.includes(">")) {
                        const parts = die.split(">");
                        if (parts.length === 2) {
                            die = parts[0];
                            context = `>${parts[1]}`;
                        }
                    }

                    if (die.includes("<")) {
                        const parts = die.split("<");
                        if (parts.length === 2) {
                            die = parts[0];
                            context = `<${parts[1]}`;
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
        return { dice, operator, context };
    };

    return (
        <div
            className={"dice-button button"}
            onClick={async (e) => {
                const button = e.currentTarget;
                button.classList.add("rolling");
                const parsed = diceToRoll();
                const roll = await roller.roll(parsed.dice, {
                    label: `{"user": "${playerContext.name}", "context": "${props.context}", "operator": "${parsed.context}"}`,
                    operator: parsed.operator,
                });
                button.classList.remove("rolling");
                if (roll && roll.data) {
                    const data = roll.data;
                    addRoll({
                        uuid: data.uuid,
                        created_at: data.created_at,
                        equation: data.equation,
                        label: data.label,
                        total_value: data.total_value,
                        username: data.user.username,
                        values: data.values,
                    });
                }
            }}
        >
            <DiceSvg />
            {props.text}
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
