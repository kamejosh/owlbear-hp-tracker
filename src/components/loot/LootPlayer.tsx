import { useLootTokenContext } from "../../context/LootTokenContext.tsx";
import lootStyles from "./loot.module.scss";
import { LootItems } from "./LootItems.tsx";
import { LootMoney } from "./LootMoney.tsx";
import { LootHeader } from "./LootHeader.tsx";

export const LootPlayer = () => {
    const data = useLootTokenContext((state) => state.data);
    const token = useLootTokenContext((state) => state.token);

    if (!token) {
        return (
            <div className={lootStyles.noItems} style={{ marginTop: "2rem" }}>
                Select a single token to view its loot
            </div>
        );
    }

    if (!data || !data.lootAvailable) {
        return (
            <>
                <LootHeader />
                <div className={lootStyles.noItems} style={{ marginTop: "2rem" }}>
                    Loot is not available for this token
                </div>
            </>
        );
    }

    return (
        <>
            <LootHeader />
            <div className={lootStyles.section}>
                <div className={lootStyles.sectionHeader}>
                    <h2 className={lootStyles.sectionTitle}>Money</h2>
                </div>
                <LootMoney readOnly={true} />
            </div>
            <div className={lootStyles.section + " " + lootStyles.last}>
                <div className={lootStyles.sectionHeader}>
                    <h2 className={lootStyles.sectionTitle}>Items</h2>
                </div>
                {data?.items.length > 0 ? (
                    <LootItems items={data.items} readOnly={true} />
                ) : (
                    <div className={lootStyles.noItems}>No items in loot</div>
                )}
            </div>
        </>
    );
};
