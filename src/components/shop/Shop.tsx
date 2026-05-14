import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import { useEffect } from "react";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import { useShopTokenContext } from "../../context/ShopTokenContext.tsx";
import { shopMetadataKey, shopModal } from "../../helper/variables.ts";
import _ from "lodash";
import { ShopMetadata } from "../../helper/types.ts";
import { ShopGM } from "./ShopGM.tsx";
import { ShopPlayer } from "./ShopPlayer.tsx";
import { ShopTokenSelect } from "./ShopTokenSelect.tsx";

const TopButtons = () => {
    return (
        <div
            style={{
                position: "fixed",
                top: "16px",
                right: "16px",
                display: "flex",
                gap: "1ch",
                boxShadow: "0 0 10px #000",
            }}
        >
            <button
                onClick={async () => {
                    await OBR.modal.close(shopModal.id);
                }}
            >
                X
            </button>
        </div>
    );
};

const Content = () => {
    const { role } = usePlayerContext();
    const token = useShopTokenContext((state) => state.token);

    if (role === "GM") {
        return token ? <ShopGM /> : <ShopTokenSelect />;
    } else {
        return <ShopPlayer />;
    }
};

export const Shop = () => {
    const setToken = useShopTokenContext((state) => state.setToken);
    const token = useShopTokenContext((state) => state.token);
    const data = useShopTokenContext((state) => state.data);
    const setData = useShopTokenContext((state) => state.setData);
    const { isReady } = SceneReadyContext();

    const initSelection = async () => {
        const selection = await OBR.player.getSelection();
        if (selection && selection.length === 1) {
            const items = await OBR.scene.items.getItems(selection);
            if (items.length === 1) {
                setToken(items[0]);
            }
        }
        return OBR.player.onChange(async (player) => {
            const items = await OBR.scene.items.getItems(player.selection);
            if (items.length === 1) {
                setToken(items[0]);
            }
        });
    };

    useEffect(() => {
        if (token) {
            return OBR.scene.items.onChange(async (items) => {
                const item = items.find((i) => i.id === token.id);
                if (item && shopMetadataKey in item.metadata) {
                    const newMetadata = item.metadata[shopMetadataKey] as ShopMetadata;
                    if (!_.isEqual(data, newMetadata)) {
                        setData(newMetadata);
                    }
                } else {
                    setData(null);
                }
            });
        }
    }, [token, data, setData]);

    useEffect(() => {
        if (isReady) {
            const promise = initSelection();
            return () => {
                promise.then((unsub) => unsub());
            };
        }
    }, [isReady]);

    if (token && !["CHARACTER", "MOUNT", "PROP"].includes(token.layer)) {
        return (
            <div style={{ textAlign: "left", padding: "16px" }}>
                <TopButtons />
                Only Items on the Character, Mount and Prop Layers can be used for Shops.
            </div>
        );
    }

    return (
        <ContextWrapper component={"modal"}>
            <div style={{ textAlign: "left" }}>
                <TopButtons />
                <Content />
            </div>
        </ContextWrapper>
    );
};
