import { useLootTokenContext } from "../../context/LootTokenContext.tsx";
import { useState } from "react";
import { Image } from "@owlbear-rodeo/sdk";
import { updateLootMetadata } from "../../helper/tokenHelper.ts";
import lootStyles from "./loot.module.scss";
import { defaultLoot } from "../../helper/variables.ts";
import Tippy from "@tippyjs/react";
import { CloseSvg } from "../svgs/CloseSvg.tsx";
import { LootItems, AddLootItem, LootSuggestions } from "./LootItems.tsx";
import { AddCircleOutline, AutoFixHigh } from "@mui/icons-material";
import { LootMoney } from "./LootMoney.tsx";

export const LootGM = () => {
    const data = useLootTokenContext((state) => state.data);
    const token = useLootTokenContext((state) => state.token);
    const setToken = useLootTokenContext((state) => state.setToken);
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    if (!token) {
        return <div>No token selected for loot</div>;
    }

    if (!data) {
        return (
            <>
                <div className={lootStyles.header}>
                    <Tippy content={"Unselect Token"}>
                        <button className={lootStyles.unselectButton} onClick={() => setToken(null)}>
                            <CloseSvg />
                        </button>
                    </Tippy>
                    <div className={lootStyles.tokenImage}>
                        {token.type === "IMAGE" ? (
                            <img src={(token as Image).image.url} alt={token.name} className={lootStyles.tokenImage} />
                        ) : null}
                    </div>
                    <h2 className={lootStyles.tokenName}>{token.name}</h2>
                </div>
                <div className={lootStyles.initContainer}>
                    Initialize Loot for Token:{" "}
                    <button
                        className={"button"}
                        onClick={() => {
                            void updateLootMetadata(defaultLoot, [token.id]);
                        }}
                    >
                        Initialize
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <div className={lootStyles.header}>
                <Tippy content={"Unselect Token"}>
                    <button className={lootStyles.unselectButton} onClick={() => setToken(null)}>
                        <CloseSvg />
                    </button>
                </Tippy>
                <div>
                    {token.type === "IMAGE" ? (
                        <img src={(token as Image).image.url} alt={token.name} className={lootStyles.tokenImage} />
                    ) : null}
                </div>
                <h2 className={lootStyles.tokenName}>{token.name}</h2>
                <Tippy
                    content={data.lootAvailable ? "Looting is enabled for players" : "Looting is disabled for players"}
                >
                    <button
                        className={`button ${lootStyles.statusButton} ${
                            data.lootAvailable ? lootStyles.lootable : lootStyles.locked
                        }`}
                        onClick={() => {
                            void updateLootMetadata({ ...data, lootAvailable: !data.lootAvailable }, [token.id]);
                        }}
                    >
                        <span
                            className={`${lootStyles.statusDot} ${
                                data.lootAvailable ? lootStyles.lootable : lootStyles.locked
                            }`}
                        />
                        {data.lootAvailable ? "Lootable" : "Locked"}
                    </button>
                </Tippy>
            </div>
            <div className={lootStyles.section}>
                <div className={lootStyles.sectionHeader}>
                    <h2 className={lootStyles.sectionTitle}>Money</h2>
                </div>
                <LootMoney />
            </div>
            <div className={lootStyles.section + " " + lootStyles.last}>
                <div className={lootStyles.sectionHeader}>
                    <h2 className={lootStyles.sectionTitle}>Items</h2>
                    <div className={lootStyles.actions}>
                        <Tippy content={"Loot Suggestions"}>
                            <button className={lootStyles.addButton} onClick={() => setIsSuggesting(!isSuggesting)}>
                                <AutoFixHigh />
                            </button>
                        </Tippy>
                        <Tippy content={"Add Item"}>
                            <button className={lootStyles.addButton} onClick={() => setIsAddingItem(true)}>
                                <AddCircleOutline />
                            </button>
                        </Tippy>
                    </div>
                </div>
                {isSuggesting && <LootSuggestions token={token} data={data} setOpen={setIsSuggesting} />}
                {isAddingItem && <AddLootItem token={token} data={data} setAddItem={setIsAddingItem} />}
                {data?.items.length > 0 ? (
                    <LootItems items={data.items} />
                ) : (
                    <div className={lootStyles.noItems}>No items in loot</div>
                )}
            </div>
        </>
    );
};
