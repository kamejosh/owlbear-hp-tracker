import { LimitComponent } from "../LimitComponent.tsx";
import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import styles from "./statblock-spellslots.module.scss";

export const SpellSlots = () => {
    const { statblock, item, data } = useE5StatblockContext();

    return (
        <>
            {statblock.spell_slots && statblock.spell_slots.length > 0 ? (
                <div className={styles.spellSlots}>
                    <div className={styles.spellSlotLimits}>
                        {statblock.spell_slots
                            .sort((a, b) => a.level - b.level)
                            .map((spellSlot, i) => {
                                const limitValues = data.stats.limits?.find((l) => l.id === spellSlot.limit!.name);
                                return limitValues ? (
                                    <div className={styles.spellSlotEntry} key={i}>
                                        <div className={styles.spellSlotLevel}>Level: {spellSlot.level}</div>
                                        <LimitComponent
                                            limit={spellSlot.limit}
                                            title={"none"}
                                            hideReset={true}
                                            limitValues={limitValues}
                                            itemId={item.id}
                                        />
                                    </div>
                                ) : null;
                            })}
                    </div>
                </div>
            ) : null}
        </>
    );
};
