import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { useActiveTabContext } from "../../../../context/ActiveTabContext.tsx";
import { useMemo } from "react";
import { E5Abilities } from "./E5Abilities.tsx";
import styles from "../pf/statblock-content.module.scss";

export const E5ActionTabs = () => {
    const { statblock, item } = useE5StatblockContext();
    const { activeTab, setActiveTab } = useActiveTabContext();
    const tabId = `${item.id}-action`;

    const tabs = useMemo(() => {
        const tabList: Array<string> = [];
        if (
            statblock.actions?.length ||
            statblock.equipment?.some((equipment) => equipment.item.bonus?.actions?.length)
        ) {
            tabList.push("action");
        }
        if (
            statblock.bonus_actions?.length ||
            statblock.equipment?.some((equipment) => equipment.item.bonus?.bonus_actions?.length)
        ) {
            tabList.push("bonus");
        }
        if (
            statblock.reactions?.length ||
            statblock.equipment?.some((equipment) => equipment.item.bonus?.reactions?.length)
        ) {
            tabList.push("reaction");
        }
        if (statblock.mythic_actions?.length) {
            tabList.push("mythic");
        }
        if (statblock.lair_actions?.length) {
            tabList.push("lair");
        }
        return tabList;
    }, [statblock]);

    const tab = tabId in activeTab ? activeTab[tabId] : tabs[0];

    const currentTab = useMemo(() => {
        if (tab === "action") {
            return <E5Abilities heading={"Actions"} abilities={statblock.actions} abilityKey={"actions"} />;
        } else if (tab === "bonus") {
            return (
                <E5Abilities
                    heading={"Bonus Actions"}
                    abilities={statblock.bonus_actions}
                    abilityKey={"bonus_actions"}
                />
            );
        } else if (tab === "reaction") {
            return <E5Abilities heading={"Reactions"} abilities={statblock.reactions} abilityKey={"reactions"} />;
        } else if (tab === "mythic") {
            return (
                <E5Abilities
                    heading={"Mythic Actions"}
                    abilities={statblock.mythic_actions}
                    abilityKey={"mythic_actions"}
                />
            );
        } else if (tab === "lair") {
            return (
                <E5Abilities heading={"Lair Actions"} abilities={statblock.lair_actions} abilityKey={"lair_actions"} />
            );
        } else {
            return <></>;
        }
    }, [tab, statblock]);

    return (
        <>
            {tabs.length === 1 ? (
                <>{currentTab}</>
            ) : (
                <div className={styles.actionWrapper}>
                    <ul className={styles.tabs}>
                        {tabs.map((t, index) => {
                            return (
                                <li
                                    key={index}
                                    className={tab === t ? `${styles.tab} ${styles.activeTab}` : styles.tab}
                                    onClick={() => setActiveTab(tabId, t)}
                                >
                                    {t}
                                </li>
                            );
                        })}
                    </ul>
                    <div className={styles.content}>{currentTab}</div>
                </div>
            )}
        </>
    );
};
