import { components } from "../../../ttrpgapi/schema";
import "./e5ability.scss";

type Ability = components["schemas"]["Action-Output"];

export const E5Ability = (props: { ability: Ability }) => {
    const ability = props.ability;
    return (
        <li key={ability.name} className={"e5-ability"}>
            <span className={"ability-info"}>
                <b>{ability.name}.</b> {ability.desc}
            </span>
            <span className={"ability-extra-info"}>
                {ability.damage_dice ? (
                    <span>
                        <i>Damage</i>: {ability.damage_dice}
                    </span>
                ) : null}
                {ability.attack_bonus ? (
                    <span>
                        <i>Attack bonus</i>: {ability.attack_bonus}
                    </span>
                ) : null}
            </span>
        </li>
    );
};
