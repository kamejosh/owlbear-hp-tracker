import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import { useEffect } from "react";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import { useLootTokenContext } from "../../context/LootTokenContext.tsx";
import { lootMetadataKey, lootPopover } from "../../helper/variables.ts";
import _ from "lodash";
import { LootMetadata } from "../../helper/types.ts";
import { LootGM } from "./LootGM.tsx";
import { LootPlayer } from "./LootPlayer.tsx";

const TopButtons = () => {
    return (
        <div style={{ position: "absolute", top: "4px", right: "16px", display: "flex", gap: "1ch" }}>
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
    const data = useLootTokenContext((state) => state.data);
    const setData = useLootTokenContext((state) => state.setData);
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
        if (token) {
            return OBR.scene.items.onChange(async (items) => {
                const item = items.find((i) => i.id === token.id);
                if (item && lootMetadataKey in item.metadata) {
                    if (!_.isEqual(data, item.metadata[lootMetadataKey])) {
                        setData(item.metadata[lootMetadataKey] as LootMetadata);
                    }
                } else {
                    setData(null);
                }
            });
        }
    }, [token, data]);

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
