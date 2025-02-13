import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { FancyLineBreak, LineBreak } from "../../../general/LineBreak.tsx";
import styles from "./statblock-inventory.module.scss";
import { ItemCharges } from "./ItemCharges.tsx";
import Tippy from "@tippyjs/react";
import { About } from "../About.tsx";
import {
    handleEquipmentChange,
    isItemAttuned,
    isItemEquipped,
    StatblockItems,
} from "../../../../helper/equipmentHelpers.ts";

export const E5Item = ({ equipment }: { equipment: StatblockItems }) => {
    const { statblock, stats, data, item } = useE5StatblockContext();

    return (
        <li key={equipment.id}>
            <div className={styles.top}>
                <span className={styles.info}>
                    <h4 className={styles.itemName}>{equipment.item.name}</h4>
                    <span>
                        {equipment.proficient ? (
                            <Tippy content={"proficient"}>
                                <b>P</b>
                            </Tippy>
                        ) : null}
                        {equipment.loot ? (
                            <Tippy content={"loot"}>
                                <b>L</b>
                            </Tippy>
                        ) : null}
                        {equipment.item.sentient ? (
                            <Tippy content={"sentient"}>
                                <b>S</b>
                            </Tippy>
                        ) : null}
                    </span>
                </span>
                <div className={styles.cost}>
                    {equipment.item.cost ? (
                        <>
                            {Object.entries(equipment.item.cost).map(([k, v]) => {
                                if (k !== "id" && v) {
                                    return (
                                        <span key={k} className={styles[k]}>
                                            {v}
                                            {k}
                                        </span>
                                    );
                                }
                                return null;
                            })}
                        </>
                    ) : null}
                </div>
            </div>
            <span className={styles.equipmentOptions}>
                {equipment.item.can_equip ? (
                    <label aria-label={"equipped"}>
                        equipped:
                        <input
                            type={"checkbox"}
                            checked={isItemEquipped(data, equipment)}
                            onChange={async (e) => {
                                const equipped = [...(data.equipment?.equipped || [])];
                                const attuned = [...(data.equipment?.attuned || [])];
                                if (e.target.checked) {
                                    equipped.push(equipment.item.slug);
                                } else {
                                    equipped.splice(
                                        equipped.findIndex((e) => e === equipment.item.slug),
                                        1,
                                    );
                                }
                                await handleEquipmentChange(data, equipped, attuned, statblock, item);
                            }}
                        />
                    </label>
                ) : null}
                {equipment.item.requires_attuning ? (
                    <label aria-label={"attuned"}>
                        attuned:
                        <input
                            type={"checkbox"}
                            checked={isItemAttuned(data, equipment)}
                            onChange={async (e) => {
                                const equipped = [...(data.equipment?.equipped || [])];
                                const attuned = [...(data.equipment?.attuned || [])];
                                if (e.target.checked) {
                                    attuned.push(equipment.item.slug);
                                } else {
                                    attuned.splice(
                                        attuned.findIndex((e) => e === equipment.item.slug),
                                        1,
                                    );
                                }
                                await handleEquipmentChange(data, equipped, attuned, statblock, item);
                            }}
                        />
                    </label>
                ) : null}
            </span>
            <ItemCharges equippedItem={equipment.item} />
            <About
                slug={equipment.item.name}
                statblock={statblock}
                stats={stats}
                about={equipment.item.description}
                context={equipment.item.name}
            />
            <LineBreak />
        </li>
    );
};

export const E5Inventory = () => {
    const { statblock } = useE5StatblockContext();
    return (
        <div>
            <h3 className={styles.heading}>Inventory</h3>
            <FancyLineBreak />
            <ul className={styles.items}>
                {statblock.equipment
                    ?.filter((equipment) => !equipment.embedded)
                    .map((equipment, index) => <E5Item key={index} equipment={equipment} />)}
            </ul>
            <h3 className={styles.heading}>Other</h3>
            <FancyLineBreak />
            <div>{statblock.items?.join(", ")}</div>
        </div>
    );
};
