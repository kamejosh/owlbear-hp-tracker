import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { IDiceRoll } from "dddice-js";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";

type DiceButtonProps = {
    dice: string;
    context: string;
};
export const DiceButton = (props: DiceButtonProps) => {
    const { addRoll } = useRollLogContext();
    const { roller } = useDiceRoller();
    const playerContext = usePlayerContext();

    const diceToRoll = () => {
        const diceToRoll: Array<IDiceRoll> = [];
        if (props.dice.includes("d")) {
            const split = props.dice.split("d");
            if (split.length === 2) {
                const amount = parseInt(split[0]);
                let die = split[1];

                if (die.includes("+")) {
                    let parts = die.split("+");
                    if (parts.length === 2) {
                        die = parts[0];
                        diceToRoll.push({ type: "mod", theme: "silvie-lr1gjqod", value: parseInt(parts[1]) });
                    }
                }

                if (die.includes("-")) {
                    let parts = die.split("-");
                    if (parts.length === 2) {
                        die = parts[0];
                        diceToRoll.push({ type: "mod", theme: "silvie-lr1gjqod", value: parseInt(parts[1]) * -1 });
                    }
                }

                for (let i = 0; i < amount; i++) {
                    diceToRoll.splice(0, 0, { type: `d${parseInt(die)}`, theme: "silvie-lr1gjqod" });
                }
            }
        } else if (props.dice.startsWith("+") || props.dice.startsWith("-")) {
            diceToRoll.push({ type: "d20", theme: "silvie-lr1gjqod" });
            diceToRoll.push({ type: "mod", theme: "silvie-lr1gjqod", value: parseInt(props.dice) });
        } else {
            console.warn("found dice string that could not be parsed", props.dice);
        }
        return diceToRoll;
    };

    return (
        <div
            className={"dice-button button"}
            onClick={async (e) => {
                const button = e.currentTarget;
                button.classList.add("rolling");
                const roll = await roller.roll(diceToRoll(), {
                    label: `${playerContext.name} - ${props.context}`,
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
            {props.dice}
        </div>
    );
};

export const DiceButtonWrapper = (text: string, context: string) => {
    const regex = /((\d+?d\d+)( ?[\+\-] ?\d+)?)|([\+\-]\d+)|(DC ?\d+)/gi;
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
                    diceField = <DiceButton dice={dice[index]} context={context} />;
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
