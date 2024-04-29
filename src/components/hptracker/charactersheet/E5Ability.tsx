import { components } from "../../../api/schema";
import { DiceButton, DiceButtonWrapper } from "../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize } from "lodash";

type Ability = components["schemas"]["Action-Output"];

export const E5Ability = (props: { ability: Ability }) => {
    const ability = props.ability;
    return (
        <li key={ability.name} className={"e5-ability"}>
            <span className={"ability-info"}>
                <b>{ability.name}.</b> {DiceButtonWrapper(ability.desc, `${capitalize(ability.name)}`)}
            </span>
            <span className={"ability-extra-info"}>
                {ability.damage_dice ? (
                    <span>
                        <i>Damage</i>:{" "}
                        <DiceButton
                            dice={ability.damage_dice}
                            text={ability.damage_dice}
                            context={`${capitalize(ability.name)}: Damage`}
                        />
                    </span>
                ) : null}
                {ability.attack_bonus ? (
                    <span>
                        <i>Attack bonus</i>:
                        <DiceButton
                            dice={`d20+${ability.attack_bonus}`}
                            text={`+${ability.attack_bonus}`}
                            context={`${capitalize(ability.name)}: To Hit`}
                        />
                    </span>
                ) : null}
            </span>
        </li>
    );
};
