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
import { useInventoryFilterContext } from "../../../../context/InventoryFilter.tsx";
import { E5ItemFilter } from "./E5ItemFilter.tsx";
export const E5Item = ({ equipment }: { equipment: StatblockItems }) => {
    const { statblock, stats, data, item } = useE5StatblockContext();

    return (
        <li key={equipment.id}>
            <div className={styles.top}>
                <span className={styles.info}>
                    <h4 className={styles.itemName}>
                        {equipment.count ? `${equipment.count}x ` : null}
                        {equipment.item.name}
                    </h4>
                    <span>
                        {equipment.item.consumable ? (
                            <Tippy content={"Can be consumed"}>
                                <i>C</i>
                            </Tippy>
                        ) : null}
                        {equipment.proficient ? (
                            <Tippy content={"proficient"}>
                                <i>P</i>
                            </Tippy>
                        ) : null}
                        {equipment.loot ? (
                            <Tippy content={"loot"}>
                                <i>L</i>
                            </Tippy>
                        ) : null}
                        {equipment.item.sentient ? (
                            <Tippy content={"sentient"}>
                                <i>S</i>
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
    const filter = useInventoryFilterContext((state) => state.filter);

    const sort = (a: StatblockItems, b: StatblockItems) => {
        if (filter.sort === "name") {
            return a.item.name.localeCompare(b.item.name);
        } else if (filter.sort === "cost") {
            const costA =
                (a.item.cost?.cp || 0) +
                10 * (a.item.cost?.sp || 0) +
                50 * (a.item.cost?.ep || 0) +
                100 * (a.item.cost?.gp || 0) +
                1000 * (a.item.cost?.pp || 0);
            const costB =
                (b.item.cost?.cp || 0) +
                10 * (b.item.cost?.sp || 0) +
                50 * (b.item.cost?.ep || 0) +
                100 * (b.item.cost?.gp || 0) +
                1000 * (b.item.cost?.pp || 0);
            const costDelta = costB - costA;
            if (costDelta === 0) {
                return a.item.name.localeCompare(b.item.name);
            } else {
                return costDelta;
            }
        } else if (filter.sort === "equipped") {
            if ((a.equipped && b.equipped) || (!a.equipped && !b.equipped)) {
                if ((a.item.can_equip && b.item.can_equip) || (!a.item.can_equip && !b.item.can_equip)) {
                    return a.item.name.localeCompare(b.item.name);
                } else if (a.item.can_equip && !b.item.can_equip) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (a.equipped && !b.equipped) {
                return -1;
            } else {
                return 1;
            }
        } else if (filter.sort === "attuned") {
            if ((a.attuned && b.attuned) || (!a.attuned && !b.attuned)) {
                if (
                    (a.item.requires_attuning && b.item.requires_attuning) ||
                    (!a.item.requires_attuning && !b.item.requires_attuning)
                ) {
                    return a.item.name.localeCompare(b.item.name);
                } else if (a.item.requires_attuning && !b.item.requires_attuning) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (a.attuned && !b.attuned) {
                return -1;
            } else {
                return 1;
            }
        }
        return 0;
    };

    const filterFunction = (item: StatblockItems) => {
        return (
            !item.embedded &&
            (!filter.filter.consumable || item.item.consumable) &&
            (!filter.filter.isEquipped || item.equipped) &&
            (!filter.filter.isAttuned || item.attuned) &&
            (filter.filter.search === "" || item.item.name.toLowerCase().includes(filter.filter.search.toLowerCase()))
        );
    };

    return (
        <div>
            <h3 className={styles.heading}>Inventory</h3>
            <FancyLineBreak />
            <E5ItemFilter />
            <ul className={styles.items}>
                {statblock.equipment
                    ?.filter(filterFunction)
                    .sort(sort)
                    .map((equipment, index) => <E5Item key={index} equipment={equipment} />)}
            </ul>
            <h3 className={styles.heading}>Other</h3>
            <FancyLineBreak />
            <div>{statblock.items?.join(", ")}</div>
        </div>
    );
};
