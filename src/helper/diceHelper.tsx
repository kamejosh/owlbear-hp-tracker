import { useDiceRoller } from "../context/DDDiceContext.tsx";
import { IDiceRoll } from "dddice-js";

export const highlightDice = (text: string) => {
    const { roller } = useDiceRoller();
    const regex = /\d+d\d+/gi;
    const dice = text.match(regex);
    const parts = text.split(regex);
    return (
        <span>
            {parts.map((part, index) => {
                let diceField = null;
                if (dice && dice.length >= index && dice[index]) {
                    const split = dice[index].split("d");
                    const diceToRoll: Array<IDiceRoll> = [];
                    if (split.length === 2) {
                        for (let i = 0; i < parseInt(split[0]); i++) {
                            diceToRoll.push({ type: `d${split[1]}`, theme: "silvie-lr1gjqod" });
                        }
                        diceField = <button onClick={() => roller.roll(diceToRoll)}>{dice[index]}</button>;
                    }
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
