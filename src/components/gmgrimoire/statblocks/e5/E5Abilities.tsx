import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import styles from "./statblock-actions.module.scss";
import { FancyLineBreak, LineBreak } from "../../../general/LineBreak.tsx";
import { Ability, E5Ability } from "./E5Ability.tsx";
import { ItemCharges } from "./ItemCharges.tsx";
import { isItemInUse } from "../../../../helper/equipmentHelpers.ts";

export const E5Abilities = ({
    heading,
    abilities,
    abilityKey,
}: {
    heading: string;
    abilities?: Array<Ability> | null;
    abilityKey: string;
}) => {
    const { statblock, equipmentBonuses, data } = useE5StatblockContext();

    const equipmentAbilities: Array<{ item: number; abilities: Array<Ability> }> =
        equipmentBonuses.itemActions.items.flatMap((itemAction) => {
            return {
                item: itemAction.itemId,
                // @ts-ignore we check if key is in object before accessing it
                abilities: abilityKey in itemAction ? itemAction[abilityKey] : [],
            };
        });

    return (
        <div>
            <h3 className={styles.heading}>{heading}</h3>
            <FancyLineBreak />
            {abilities?.map((action, index) => {
                return (
                    <div key={index}>
                        <E5Ability ability={action} proficient={!!action.use_proficiency} />
                        <LineBreak />
                    </div>
                );
            })}
            {statblock.equipment
                ?.filter((e) => e.embedded && isItemInUse(data, e))
                ?.map((e) => {
                    return equipmentAbilities
                        .filter((itemAction) => itemAction.item === e.item.id)
                        .map((itemAction) => {
                            return itemAction.abilities.map((ability, index) => {
                                return (
                                    <div key={index}>
                                        <E5Ability ability={ability} proficient={e.proficient} />
                                        <LineBreak />
                                    </div>
                                );
                            });
                        });
                })}
            {statblock.equipment
                ?.filter((e) => !e.embedded && isItemInUse(data, e))
                ?.map((e) => {
                    return equipmentAbilities
                        .filter((itemAction) => itemAction.item === e.item.id)
                        .map((itemAction, index) => {
                            if (!itemAction.abilities.length) return null;
                            return (
                                <div key={index}>
                                    <h4 className={styles.itemName}>{e?.item.name}</h4>
                                    <ItemCharges equippedItem={e.item} />
                                    <FancyLineBreak />
                                    {itemAction.abilities.map((ability, index) => {
                                        return (
                                            <div key={index}>
                                                <E5Ability
                                                    ability={ability}
                                                    proficient={e.proficient}
                                                    range={
                                                        (e.item.tags &&
                                                            e.item.tags.includes("throw") &&
                                                            e.item.range) ||
                                                        e.item.range
                                                            ? e.item.range
                                                            : undefined
                                                    }
                                                />
                                                <LineBreak />
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        });
                })}
        </div>
    );
};
