import { components } from "../../../../api/schema";
import { DiceButton, DiceButtonWrapper, Stats } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize, isInteger } from "lodash";
import { LimitComponent } from "../LimitComponent.tsx";
import { GMGMetadata } from "../../../../helper/types.ts";
import { updateLimit } from "../../../../helper/helpers.ts";

export type Ability = components["schemas"]["Action-Output"];

export const E5Ability = ({
    ability,
    statblock,
    tokenData,
    itemId,
    stats,
}: {
    ability: Ability;
    statblock: string;
    tokenData: GMGMetadata;
    itemId: string;
    stats: Stats;
}) => {
    const limitValues = tokenData.stats.limits?.find((l) => l.id === ability.limit?.name)!;

    const limitReached = limitValues && limitValues.max === limitValues.used;

    return (
        <li key={ability.name} className={"e5-ability"}>
            <span className={"ability-info"}>
                <b className={"ability-name"}>{ability.name}.</b>
                {ability.limit && tokenData.stats.limits && limitValues ? (
                    <LimitComponent limit={ability.limit} title={"uses"} limitValues={limitValues} itemId={itemId} />
                ) : null}
            </span>
            <div>
                <DiceButtonWrapper
                    text={ability.desc}
                    context={`${capitalize(ability.name)}`}
                    statblock={statblock}
                    stats={stats}
                    onRoll={
                        !ability.attack_bonus
                            ? async () => {
                                  await updateLimit(itemId, limitValues);
                              }
                            : undefined
                    }
                    limitReached={!ability.attack_bonus ? limitReached : undefined}
                />
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
                            stats={stats}
                            onRoll={async () => {
                                await updateLimit(itemId, limitValues);
                            }}
                            limitReached={limitReached}
                        />
                    </span>
                ) : null}
                {ability.damage_dice ? (
                    <span>
                        <i>Damage</i>:{" "}
                        {isInteger(Number(ability.damage_dice)) ? (
                            <span className={"dice-button button"}>{ability.damage_dice}</span>
                        ) : (
                            <DiceButton
                                dice={ability.damage_dice}
                                text={ability.damage_dice}
                                context={`${capitalize(ability.name)}: Damage`}
                                statblock={statblock}
                                stats={stats}
                                onRoll={
                                    !ability.attack_bonus
                                        ? async () => {
                                              await updateLimit(itemId, limitValues);
                                          }
                                        : undefined
                                }
                                limitReached={!ability.attack_bonus ? limitReached : undefined}
                                damageDie={true}
                            />
                        )}
                    </span>
                ) : null}
            </span>
        </li>
    );
};
