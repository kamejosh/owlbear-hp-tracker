import { useMemo } from "react";
import styles from "./statblock-content.module.scss";
import { useActiveTabContext } from "../../../../context/ActiveTabContext.tsx";
import { usePFStatblockContext } from "../../../../context/PFStatblockContext.tsx";
import { PFGeneral } from "./PFGeneral.tsx";
import { PFSkills } from "./PFSkills.tsx";
import { PFActionTabs } from "./PFActionTabs.tsx";
import { PFAbilities } from "./PFAbilities.tsx";
import { PfSpells } from "./PfSpells.tsx";
import { PFInventory } from "./PFInventory.tsx";

export const PFStatblockContent = () => {
    const { statblock, item } = usePFStatblockContext();
    const { activeTab, setActiveTab } = useActiveTabContext();
    const tab = item.id in activeTab ? activeTab[item.id] : "general";

    const tabs = useMemo(() => {
        const tabList: Array<string> = ["general", "skills"];
        if (statblock.actions?.length || statblock.reactions?.length) {
            tabList.push("actions");
        }
        if (statblock.items?.length) {
            tabList.push("inventory");
        }
        if (statblock.spells?.length) {
            tabList.push("spells");
        }
        if (statblock.special_abilities?.length) {
            tabList.push("special");
        }
        return tabList;
    }, [statblock]);

    const currentTab = useMemo(() => {
        if (tab === "general") {
            return <PFGeneral />;
        } else if (tab === "skills") {
            return <PFSkills />;
        } else if (tab === "actions") {
            return <PFActionTabs />;
        } else if (tab === "inventory") {
            return <PFInventory />;
        } else if (tab === "spells") {
            return <PfSpells spells={statblock.spells} statblock={statblock.name} stats={statblock.stats} />;
        } else if (tab === "special") {
            return <PFAbilities heading={"Reactions"} abilities={statblock.special_abilities} />;
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
