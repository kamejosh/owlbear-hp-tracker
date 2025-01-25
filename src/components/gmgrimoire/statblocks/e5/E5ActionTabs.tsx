import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { useActiveTabContext } from "../../../../context/ActiveTabContext.tsx";
import { useMemo } from "react";
import { E5Actions, E5BonusActions, E5Mythics, E5Reactions } from "./E5Actions.tsx";
import styles from "../statblock-content.module.scss";

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
        return tabList;
    }, [statblock]);

    const tab = tabId in activeTab ? activeTab[tabId] : tabs[0];

    const currentTab = useMemo(() => {
        if (tab === "action") {
            return <E5Actions />;
        } else if (tab === "bonus") {
            return <E5BonusActions />;
        } else if (tab === "reaction") {
            return <E5Reactions />;
        } else if (tab === "mythic") {
            return <E5Mythics />;
        } else {
            return <></>;
        }
    }, [tab]);

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
