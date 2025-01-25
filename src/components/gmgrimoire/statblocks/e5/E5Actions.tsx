import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import styles from "./statblock-actions.module.scss";
import { FancyLineBreak, LineBreak } from "../../../general/LineBreak.tsx";
import { E5Ability } from "./E5Ability.tsx";
import { isArray } from "lodash";

export const E5Actions = () => {
    const { statblock, equipmentBonuses } = useE5StatblockContext();

    return (
        <div>
            <h3 className={styles.heading}>Actions</h3>
            <FancyLineBreak />
            {statblock.actions?.map((action, index) => {
                return (
                    <div key={index}>
                        <E5Ability ability={action} />
                        <LineBreak />
                    </div>
                );
            })}
            {equipmentBonuses.itemActions.items.map((itemAction, index) => {
                if (isArray(itemAction.actions) && itemAction.actions.length > 0) {
                    const item = statblock.equipment?.find((e) => e.item.id === itemAction.itemId);
                    return (
                        <div key={index}>
                            <h4 className={styles.itemName}>{item?.item.name}</h4>
                            <FancyLineBreak />
                            {itemAction.actions.map((action, index) => (
                                <div key={index}>
                                    <E5Ability ability={action} />
                                    <LineBreak />
                                </div>
                            ))}
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};

export const E5BonusActions = () => {
    const { statblock, equipmentBonuses } = useE5StatblockContext();

    return (
        <div>
            <h3 className={styles.heading}>Bonus Actions</h3>
            <FancyLineBreak />
            {statblock.bonus_actions?.map((action, index) => {
                return (
                    <div key={index}>
                        <E5Ability ability={action} />
                        <LineBreak />
                    </div>
                );
            })}
            {equipmentBonuses.itemActions.items.map((itemAction, index) => {
                if (isArray(itemAction.bonus_actions) && itemAction.bonus_actions.length > 0) {
                    const item = statblock.equipment?.find((e) => e.item.id === itemAction.itemId);
                    return (
                        <div key={index}>
                            <h4 className={styles.itemName}>{item?.item.name}</h4>
                            <FancyLineBreak />
                            {itemAction.bonus_actions.map((action, index) => (
                                <div key={index}>
                                    <E5Ability ability={action} />
                                    <LineBreak />
                                </div>
                            ))}
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};

export const E5Reactions = () => {
    const { statblock, equipmentBonuses } = useE5StatblockContext();

    return (
        <div>
            <h3 className={styles.heading}>Reactions</h3>
            <FancyLineBreak />
            {statblock.reactions?.map((action, index) => {
                return (
                    <div key={index}>
                        <E5Ability ability={action} />
                        <LineBreak />
                    </div>
                );
            })}
            {equipmentBonuses.itemActions.items.map((itemAction, index) => {
                if (isArray(itemAction.reactions) && itemAction.reactions.length > 0) {
                    const item = statblock.equipment?.find((e) => e.item.id === itemAction.itemId);
                    return (
                        <div key={index}>
                            <h4 className={styles.itemName}>{item?.item.name}</h4>
                            <FancyLineBreak />
                            {itemAction.reactions.map((action, index) => (
                                <div key={index}>
                                    <E5Ability ability={action} />
                                    <LineBreak />
                                </div>
                            ))}
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};

export const E5Mythics = () => {
    const { statblock } = useE5StatblockContext();

    return (
        <div>
            <h3 className={styles.heading}>Mythic Actions</h3>
            <FancyLineBreak />
            {statblock.mythic_actions?.map((action, index) => {
                return (
                    <div key={index}>
                        <E5Ability ability={action} />
                        <LineBreak />
                    </div>
                );
            })}
        </div>
    );
};

export const E5Legendary = () => {
    const { statblock } = useE5StatblockContext();

    return (
        <div>
            <h3 className={styles.heading}>Legendary Actions</h3>
            <FancyLineBreak />
            {statblock.legendary_desc ? <div>{statblock.legendary_desc}</div> : null}
            <LineBreak />
            {statblock.legendary_actions?.map((action, index) => {
                return (
                    <div key={index}>
                        <E5Ability ability={action} />
                        <LineBreak />
                    </div>
                );
            })}
        </div>
    );
};

export const E5Special = () => {
    const { statblock, equipmentBonuses } = useE5StatblockContext();

    return (
        <div>
            <h3 className={styles.heading}>Specials & Traits</h3>
            <FancyLineBreak />
            {statblock.special_abilities?.map((action, index) => {
                return (
                    <div key={index}>
                        <E5Ability ability={action} />
                        <LineBreak />
                    </div>
                );
            })}
            {equipmentBonuses.itemActions.items.map((itemAction, index) => {
                if (isArray(itemAction.special_abilities) && itemAction.special_abilities.length > 0) {
                    const item = statblock.equipment?.find((e) => e.item.id === itemAction.itemId);
                    return (
                        <div key={index}>
                            <h4 className={styles.itemName}>{item?.item.name}</h4>
                            <FancyLineBreak />
                            {itemAction.special_abilities.map((action, index) => (
                                <div key={index}>
                                    <E5Ability ability={action} />
                                    <LineBreak />
                                </div>
                            ))}
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
};
