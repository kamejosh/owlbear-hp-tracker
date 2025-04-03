import { components } from "../../../../api/schema";
import { DiceButton } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize, isInteger, isUndefined } from "lodash";
import { LimitComponent } from "../LimitComponent.tsx";
import { updateLimit } from "../../../../helper/helpers.ts";
import { useMemo } from "react";
import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import Tippy from "@tippyjs/react";
import { About } from "../About.tsx";

export type Ability = components["schemas"]["Action-Output"];

export const E5Ability = ({
    ability,
    proficient,
    range,
}: {
    ability: Ability;
    proficient?: boolean;
    range?: string;
}) => {
    const { item, stats, data, tokenName, statblock } = useE5StatblockContext();
    const limitValues = data.stats.limits?.find((l) => l.id === ability.limit?.name)!;

    const limitReached = limitValues && limitValues.max === limitValues.used;

    const statBonus = useMemo(() => {
        let statBonus: { bonus?: number; stat: string } = {
            bonus: undefined,
            stat: "",
        };
        const getStatBonus = (statName: string, statValue: number, current: { bonus?: number; stat: string }) => {
            const bonus = Math.floor((statValue - 10) / 2);
            if (isUndefined(current.bonus) || bonus > current.bonus) {
                return { bonus, stat: statName };
            }
            return current;
        };
        if (ability.stat_bonus) {
            ability.stat_bonus.forEach((stat) => {
                if (stat === "STR") {
                    statBonus = getStatBonus(stat, stats.strength, statBonus);
                } else if (stat === "DEX") {
                    statBonus = getStatBonus(stat, stats.dexterity, statBonus);
                } else if (stat === "CON") {
                    statBonus = getStatBonus(stat, stats.constitution, statBonus);
                } else if (stat === "INT") {
                    statBonus = getStatBonus(stat, stats.intelligence, statBonus);
                } else if (stat === "WIS") {
                    statBonus = getStatBonus(stat, stats.wisdom, statBonus);
                } else if (stat === "CHA") {
                    statBonus = getStatBonus(stat, stats.charisma, statBonus);
                }
            });
        }
        return statBonus;
    }, [ability, stats]);
    const attackBonus = ability.attack_bonus || 0;
    const profBonus = proficient && statblock.proficiency_bonus ? statblock.proficiency_bonus : 0;
    const bonus = (statBonus.bonus || 0) + attackBonus + profBonus;

    const attackTooltipContent = useMemo(() => {
        const tooltips = [];
        if (attackBonus) {
            tooltips.push(`Attack: ${attackBonus}`);
        }
        if (statBonus.bonus) {
            tooltips.push(`Stat (${statBonus.stat}): ${statBonus.bonus}`);
        }
        if (profBonus) {
            tooltips.push(`Proficiency: ${profBonus}`);
        }
        return tooltips.join(", ");
    }, [attackBonus, statBonus, profBonus]);

    if (ability.needs_proficiency && !proficient) {
        return null;
    }

    return (
        <li key={ability.name} className={"e5-ability"}>
            <span className={"ability-info"}>
                <b className={"ability-name"}>{ability.name}</b>
                {range ? (
                    <div>
                        <b>Range: </b>
                        <span>{range.replace("units", "ft")}</span>
                    </div>
                ) : null}
                {ability.limit && data.stats.limits && limitValues ? (
                    <LimitComponent limit={ability.limit} title={"uses"} limitValues={limitValues} itemId={item.id} />
                ) : null}
            </span>
            <About
                slug={ability.name}
                statblock={statblock}
                stats={stats}
                about={ability.desc || ""}
                context={capitalize(ability.name)}
                defaultOpen={true}
                hideTitle={true}
            />
            <span className={"ability-extra-info"}>
                {(ability.stat_bonus && ability.stat_bonus.length > 0) || attackBonus != 0 ? (
                    <span className={"extra-info-with-button"}>
                        <i>Hit:</i>
                        <Tippy content={attackTooltipContent} duration={200} delay={1000}>
                            <span>
                                <DiceButton
                                    dice={`d20+${bonus}`}
                                    text={`+${bonus}`}
                                    context={`${capitalize(ability.name)}: To Hit`}
                                    statblock={tokenName}
                                    stats={stats}
                                    onRoll={async () => {
                                        await updateLimit(item.id, limitValues);
                                    }}
                                    limitReached={limitReached}
                                    proficiencyBonus={statblock.proficiency_bonus}
                                />
                            </span>
                        </Tippy>
                    </span>
                ) : null}
                {ability.damage_dice ? (
                    <span className={"extra-info-with-button"}>
                        <i>Damage:</i>
                        {isInteger(Number(ability.damage_dice)) ? (
                            <b>{ability.damage_dice}</b>
                        ) : (
                            <DiceButton
                                dice={ability.damage_dice}
                                text={ability.damage_dice}
                                context={`${capitalize(ability.name)}: Damage`}
                                statblock={tokenName}
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
                                proficiencyBonus={statblock.proficiency_bonus}
                            />
                        )}
                    </span>
                ) : null}
            </span>
        </li>
    );
};
