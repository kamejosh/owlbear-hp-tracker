import { useMemo, useState } from "react";
import { useE5StatblockContext } from "../../../context/E5StatblockContext.tsx";
import styles from "./statblock-content.module.scss";
import { E5General } from "./e5/E5General.tsx";

export const StatblockContent = () => {
    const { statblock } = useE5StatblockContext();
    const [activeTab, setActiveTab] = useState<string>("general");

    const tabs = useMemo(() => {
        const tabList: Array<string> = ["general", "skills"];
        if (
            statblock.actions ||
            statblock.bonus_actions ||
            statblock.mythic_actions ||
            statblock.reactions ||
            statblock.equipment?.some(
                (equipment) =>
                    equipment.item.bonus?.actions ||
                    equipment.item.bonus?.bonus_actions ||
                    equipment.item.bonus?.reactions,
            )
        ) {
            tabList.push("actions");
        }
        if (statblock.items || statblock.equipment) {
            tabList.push("inventory");
        }
        if (statblock.spells || statblock.equipment?.some((equipment) => equipment.item.spells)) {
            tabList.push("spells");
        }
        if (
            statblock.special_abilities ||
            statblock.equipment?.some((equipment) => equipment.item.bonus?.special_abilities)
        ) {
            tabList.push("special");
        }
        if (statblock.legendary_actions) {
            tabList.push("legendary");
        }
        return tabList;
    }, [statblock]);
    return (
        <div>
            <ul className={styles.tabs}>
                {tabs.map((tab, index) => {
                    return (
                        <li
                            key={index}
                            className={activeTab === tab ? `${styles.tab} ${styles.activeTab}` : styles.tab}
                        >
                            {tab}
                        </li>
                    );
                })}
            </ul>
            <div className={styles.content}>
                <E5General />
            </div>
        </div>
    );
};
