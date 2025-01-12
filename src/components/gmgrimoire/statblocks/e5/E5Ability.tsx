import { components } from "../../../../api/schema";
import { DiceButton, DiceButtonWrapper } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize, isInteger } from "lodash";
import { LimitComponent } from "../LimitComponent.tsx";
import { updateLimit } from "../../../../helper/helpers.ts";
import { useMemo } from "react";
import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";

export type Ability = components["schemas"]["Action-Output"];

export const E5Ability = ({ ability, statblock }: { ability: Ability; statblock: string }) => {
    const { item, stats, data } = useE5StatblockContext();
    const limitValues = data.stats.limits?.find((l) => l.id === ability.limit?.name)!;

    const limitReached = limitValues && limitValues.max === limitValues.used;

    const bonus = useMemo(() => {
        let statBonus = 0;
        if (ability.stat_bonus) {
            const statBonuses: Array<number> = [];
            ability.stat_bonus.forEach((stat) => {
                if (stat === "STR") {
                    statBonuses.push(Math.floor((stats.strength - 10) / 2));
                } else if (stat === "DEX") {
                    statBonuses.push(Math.floor((stats.dexterity - 10) / 2));
                } else if (stat === "CON") {
                    statBonuses.push(Math.floor((stats.constitution - 10) / 2));
                } else if (stat === "INT") {
                    statBonuses.push(Math.floor((stats.intelligence - 10) / 2));
                } else if (stat === "WIS") {
                    statBonuses.push(Math.floor((stats.wisdom - 10) / 2));
                } else if (stat === "CHA") {
                    statBonuses.push(Math.floor((stats.charisma - 10) / 2));
                }
            });
            statBonus = Math.max(...statBonuses);
        }
        return ability.attack_bonus ? Math.max(ability.attack_bonus, statBonus) : statBonus;
    }, [ability, stats]);

    return (
        <li key={ability.name} className={"e5-ability"}>
            <span className={"ability-info"}>
                <b className={"ability-name"}>{ability.name}.</b>
                {ability.limit && data.stats.limits && limitValues ? (
                    <LimitComponent limit={ability.limit} title={"uses"} limitValues={limitValues} itemId={item.id} />
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
                                  await updateLimit(item.id, limitValues);
                              }
                            : undefined
                    }
                    limitReached={!ability.attack_bonus ? limitReached : undefined}
                />
            </div>
            <span className={"ability-extra-info"}>
                {bonus > 0 ? (
                    <span>
                        <i>Attack bonus</i>:
                        <DiceButton
                            dice={`d20+${bonus}`}
                            text={`+${bonus}`}
                            context={`${capitalize(ability.name)}: To Hit`}
                            statblock={statblock}
                            stats={stats}
                            onRoll={async () => {
                                await updateLimit(item.id, limitValues);
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
                                              await updateLimit(item.id, limitValues);
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
