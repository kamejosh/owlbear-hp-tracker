import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import styles from "./statblock-actions.module.scss";
import { FancyLineBreak, LineBreak } from "../../../general/LineBreak.tsx";
import { Ability, E5Ability } from "./E5Ability.tsx";
import { isArray } from "lodash";
import { ItemCharges } from "./ItemCharges.tsx";

export const E5Abilities = ({
    heading,
    abilities,
    abilityKey,
}: {
    heading: string;
    abilities?: Array<Ability> | null;
    abilityKey: string;
}) => {
    const { statblock, equipmentBonuses } = useE5StatblockContext();
    return (
        <div>
            <h3 className={styles.heading}>{heading}</h3>
            <FancyLineBreak />
            {abilities?.map((action, index) => {
                return (
                    <div key={index}>
                        <E5Ability ability={action} />
                        <LineBreak />
                    </div>
                );
            })}
            {equipmentBonuses.itemActions.items.map((itemAction, index) => {
                const equipmentAbilities: Array<Ability> =
                    // @ts-ignore we check if key is in object before accessing it
                    abilityKey in itemAction ? itemAction[abilityKey] : [];

                if (isArray(equipmentAbilities) && equipmentAbilities.length > 0) {
                    const equippedItem = statblock.equipment?.find((e) => e.item.id === itemAction.itemId);

                    if (
                        equippedItem &&
                        ((equippedItem.item.requires_attuning && equippedItem.attuned && equippedItem.equipped) ||
                            (!equippedItem.item.requires_attuning && equippedItem.equipped))
                    ) {
                        return (
                            <div key={index}>
                                <h4 className={styles.itemName}>{equippedItem?.item.name}</h4>
                                <ItemCharges equippedItem={equippedItem.item} />
                                <FancyLineBreak />
                                {equipmentAbilities.map((action, index) => (
                                    <div key={index}>
                                        <E5Ability ability={action} proficient={equippedItem.proficient} />
                                        <LineBreak />
                                    </div>
                                ))}
                            </div>
                        );
                    }
                    return null;
                }
                return null;
            })}
        </div>
    );
};
