import { useActiveTabContext } from "../../../../context/ActiveTabContext.tsx";
import { useMemo } from "react";
import styles from "../pf/statblock-content.module.scss";
import { usePFStatblockContext } from "../../../../context/PFStatblockContext.tsx";
import { PFAbilities } from "./PFAbilities.tsx";

export const PFActionTabs = () => {
    const { statblock, item } = usePFStatblockContext();
    const { activeTab, setActiveTab } = useActiveTabContext();
    const tabId = `${item.id}-action`;

    const tabs = useMemo(() => {
        const tabList: Array<string> = [];
        if (statblock.actions?.length) {
            tabList.push("action");
        }
        if (statblock.reactions?.length) {
            tabList.push("reaction");
        }

        return tabList;
    }, [statblock]);

    const tab = tabId in activeTab ? activeTab[tabId] : tabs[0];

    const currentTab = useMemo(() => {
        if (tab === "action") {
            return <PFAbilities heading={"Actions"} abilities={statblock.actions} />;
        } else if (tab === "reaction") {
            return <PFAbilities heading={"Reactions"} abilities={statblock.reactions} />;
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
