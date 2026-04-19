import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { usePartyStore } from "../../context/PartyStore.tsx";
import { useEffect } from "react";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import OBR, { Image } from "@owlbear-rodeo/sdk";
import { useLootTokenContext } from "../../context/LootTokenContext.tsx";
import { lootPopover } from "../../helper/variables.ts";

const TopButtons = () => {
    return (
        <div style={{ position: "absolute", top: "1ch", right: "1ch", display: "flex", gap: "1ch" }}>
            <button
                onClick={async () => {
                    await OBR.popover.close(lootPopover.id);
                }}
            >
                X
            </button>
        </div>
    );
};

export const Loot = () => {
    const setToken = useLootTokenContext((state) => state.setToken);
    const token = useLootTokenContext((state) => state.token);
    const { isReady } = SceneReadyContext();

    const initPopover = async () => {
        const selection = await OBR.player.getSelection();
        if (selection && selection.length === 1) {
            const token = await OBR.scene.items.getItems(selection);
            if (token.length === 1) {
                setToken(token[0]);
            }
        }
        OBR.player.onChange(async (player) => {
            const token = await OBR.scene.items.getItems(player.selection);
            if (token.length === 1) {
                setToken(token[0]);
            } else {
                setToken(null);
            }
        });
    };

    useEffect(() => {
        if (isReady) {
            initPopover();
        }
    }, [isReady]);

    return (
        <ContextWrapper component={"modal"}>
            <div style={{ textAlign: "left" }}>
                <TopButtons />
                {token ? <Content /> : <div>Loot is only available for a single item at a time.</div>}
            </div>
        </ContextWrapper>
    );
};

const Content = () => {
    const playerContext = usePlayerContext();

    if (playerContext.role === "GM") {
        return <LootGM />;
    } else {
        return <LootPlayer />;
    }
};

const LootGM = () => {
    const data = useLootTokenContext((state) => state.data);
    const token = useLootTokenContext((state) => state.token);
    const room = useMetadataContext((state) => state.room);
    const currentParty = usePartyStore((state) => state.currentParty);

    if (!token) {
        return <div>No token selected for loot</div>;
    }

    return (
        <>
            <div style={{ display: "flex", gap: "1ch", alignItems: "center" }}>
                <div>
                    {token.type === "IMAGE" ? (
                        <img src={(token as Image).image.url} alt={token.name} style={{ height: "40px" }} />
                    ) : null}
                </div>
                <h2 style={{ margin: 0 }}>{token.name}</h2>
            </div>
            <div>
                <h2>Money</h2>
                {data?.money.cp}
            </div>
            <div>
                <h2>Items</h2>
                {data?.items.map((item) => {
                    return (
                        <div key={item.id}>
                            <h3>
                                {item.count}x {item.name}
                            </h3>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

const LootPlayer = () => {};
