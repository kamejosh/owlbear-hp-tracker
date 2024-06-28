import { components } from "../../../api/schema";
import { DiceButton, DiceButtonWrapper } from "../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize } from "lodash";
import { LimitComponent } from "./LimitComponent.tsx";
import { HpTrackerMetadata } from "../../../helper/types.ts";

export type Ability = components["schemas"]["Action-Output"];

export const E5Ability = ({
    ability,
    statblock,
    tokenData,
    itemId,
}: {
    ability: Ability;
    statblock: string;
    tokenData: HpTrackerMetadata;
    itemId: string;
}) => {
    return (
        <li key={ability.name} className={"e5-ability"}>
            <span className={"ability-info"}>
                <b>{ability.name}.</b>{" "}
                {ability.limit && tokenData.stats.limits ? (
                    <LimitComponent
                        limit={ability.limit}
                        showTitle={false}
                        limitValues={tokenData.stats.limits.find((l) => l.id === ability.limit!.name)!}
                        itemId={itemId}
                    />
                ) : null}
            </span>
            <div>
                <DiceButtonWrapper text={ability.desc} context={`${capitalize(ability.name)}`} statblock={statblock} />
            </div>
            <span className={"ability-extra-info"}>
                {ability.attack_bonus ? (
                    <span>
                        <i>Attack bonus</i>:
                        <DiceButton
                            dice={`d20+${ability.attack_bonus}`}
                            text={`+${ability.attack_bonus}`}
                            context={`${capitalize(ability.name)}: To Hit`}
                            statblock={statblock}
                        />
                    </span>
                ) : null}
                {ability.damage_dice ? (
                    <span>
                        <i>Damage</i>:{" "}
                        <DiceButton
                            dice={ability.damage_dice}
                            text={ability.damage_dice}
                            context={`${capitalize(ability.name)}: Damage`}
                            statblock={statblock}
                        />
                    </span>
                ) : null}
            </span>
        </li>
    );
};
