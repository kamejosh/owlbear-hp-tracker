import { useMemo } from "react";
import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import styles from "./statblock-content.module.scss";
import { E5General } from "./E5General.tsx";
import { E5Skills } from "./E5Skills.tsx";
import { useActiveTabContext } from "../../../../context/ActiveTabContext.tsx";
import { E5ActionTabs } from "./E5ActionTabs.tsx";
import { E5Abilities } from "./E5Abilities.tsx";
import { E5Spells } from "./E5Spells.tsx";
import { E5Inventory } from "./E5Inventory.tsx";

export const E5StatblockContent = () => {
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
        if (statblock.items?.length || statblock.equipment?.length) {
            tabList.push("inventory");
        }
        if (statblock.spells?.length || statblock.equipment?.some((equipment) => equipment.item.spells?.length)) {
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
        } else if (tab === "inventory") {
            return <E5Inventory />;
        } else if (tab === "spells") {
            return <E5Spells />;
        } else if (tab === "special") {
            return (
                <E5Abilities
                    heading={"Specials & Traits"}
                    abilities={statblock.special_abilities}
                    abilityKey={"special_abilities"}
                />
            );
        } else if (tab === "legendary") {
            return (
                <E5Abilities
                    heading={"Legendary Actions"}
                    abilities={statblock.legendary_actions}
                    abilityKey={"legendary_actions"}
                />
            );
        } else {
            return <></>;
        }
    }, [tab, statblock]);

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
