import { useMemo } from "react";
import { useE5StatblockContext } from "../../../context/E5StatblockContext.tsx";
import styles from "./statblock-content.module.scss";
import { E5General } from "./e5/E5General.tsx";
import { E5Skills } from "./e5/E5Skills.tsx";
import { useActiveTabContext } from "../../../context/ActiveTabContext.tsx";
import { E5ActionTabs } from "./e5/E5ActionTabs.tsx";
import { E5Legendary, E5Special } from "./e5/E5Actions.tsx";
import { E5Spells } from "./e5/E5Spells.tsx";

export const StatblockContent = () => {
    const { statblock, item } = useE5StatblockContext();
    const { activeTab, setActiveTab } = useActiveTabContext();
    const tab = item.id in activeTab ? activeTab[item.id] : "general";

    const tabs = useMemo(() => {
        const tabList: Array<string> = ["general", "skills"];
        if (
            statblock.actions?.length ||
            statblock.bonus_actions?.length ||
            statblock.mythic_actions?.length ||
            statblock.reactions?.length ||
            statblock.equipment?.some(
                (equipment) =>
                    equipment.item.bonus?.actions?.length ||
                    equipment.item.bonus?.bonus_actions?.length ||
                    equipment.item.bonus?.reactions?.length,
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
            statblock.special_abilities?.length ||
            statblock.equipment?.some((equipment) => equipment.item.bonus?.special_abilities?.length)
        ) {
            tabList.push("special");
        }
        if (statblock.legendary_actions?.length) {
            tabList.push("legendary");
        }
        return tabList;
    }, [statblock]);

    const currentTab = useMemo(() => {
        if (tab === "general") {
            return <E5General />;
        } else if (tab === "skills") {
            return <E5Skills />;
        } else if (tab === "actions") {
            return <E5ActionTabs />;
        } else if (tab === "spells") {
            return <E5Spells />;
        } else if (tab === "special") {
            return <E5Special />;
        } else if (tab === "legendary") {
            return <E5Legendary />;
        } else {
            return <></>;
        }
    }, [tab]);

    return (
        <div className={styles.wrapper}>
            <ul className={styles.tabs}>
                {tabs.map((t, index) => {
                    return (
                        <li
                            key={index}
                            className={tab === t ? `${styles.tab} ${styles.activeTab}` : styles.tab}
                            onClick={() => setActiveTab(item.id, t)}
                        >
                            {t}
                        </li>
                    );
                })}
            </ul>
            <div className={styles.content}>{currentTab}</div>
        </div>
    );
};
