import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { FancyLineBreak, LineBreak } from "../../../general/LineBreak.tsx";
import styles from "./statblock-inventory.module.scss";
import { ItemCharges } from "./ItemCharges.tsx";
import Tippy from "@tippyjs/react";
import { About } from "../About.tsx";
import { StatblockItems } from "../../../../helper/equipmentHelpers.ts";

export const E5Item = ({ equipment }: { equipment: StatblockItems }) => {
    const { statblock, stats } = useE5StatblockContext();
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
                        {equipment.equipped ? (
                            <Tippy content={"equipped"}>
                                <b>E</b>
                            </Tippy>
                        ) : null}
                        {equipment.attuned ? (
                            <Tippy content={"attuned"}>
                                <b>A</b>
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
            <ItemCharges equippedItem={equipment.item} />
            <About slug={equipment.item.name} statblock={statblock} stats={stats} about={equipment.item.description} />
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
                {statblock.equipment?.map((equipment) => <E5Item equipment={equipment} />)}
            </ul>
            <h3 className={styles.heading}>Other</h3>
            <FancyLineBreak />
            <div>{statblock.items?.join(", ")}</div>
        </div>
    );
};
