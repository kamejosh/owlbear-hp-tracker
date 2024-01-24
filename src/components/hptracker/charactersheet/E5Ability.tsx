import { components } from "../../../ttrpgapi/schema";
import { DiceButtonWrapper } from "../../general/DiceRoller/DiceButtonWrapper.tsx";

type Ability = components["schemas"]["Action-Output"];

export const E5Ability = (props: { ability: Ability }) => {
    const ability = props.ability;
    return (
        <li key={ability.name} className={"e5-ability"}>
            <span className={"ability-info"}>
                <b>{ability.name}.</b> {DiceButtonWrapper(ability.desc, `${ability.name}`)}
            </span>
            <span className={"ability-extra-info"}>
                {ability.damage_dice ? (
                    <span>
                        <i>Damage</i>: {DiceButtonWrapper(ability.damage_dice, `${ability.name} Damage`)}
                    </span>
                ) : null}
                {ability.attack_bonus ? (
                    <span>
                        <i>Attack bonus</i>: {DiceButtonWrapper(`+${ability.attack_bonus}`, `${ability.name} Attack`)}
                    </span>
                ) : null}
            </span>
        </li>
    );
};
