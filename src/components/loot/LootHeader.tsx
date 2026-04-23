import { useLootTokenContext } from "../../context/LootTokenContext.tsx";
import { Image } from "@owlbear-rodeo/sdk";
import lootStyles from "./loot.module.scss";
import Tippy from "@tippyjs/react";
import { CloseSvg } from "../svgs/CloseSvg.tsx";
import { updateLootMetadata } from "../../helper/tokenHelper.ts";

export const LootHeader = ({ showStatus = false }: { showStatus?: boolean }) => {
    const data = useLootTokenContext((state) => state.data);
    const token = useLootTokenContext((state) => state.token);
    const setToken = useLootTokenContext((state) => state.setToken);

    if (!token) return null;

    return (
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
            {showStatus && data && (
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
            )}
        </div>
    );
};
