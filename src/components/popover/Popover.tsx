import { ContextWrapper } from "../ContextWrapper.tsx";
import React, { useEffect, useState } from "react";
import { Token } from "../hptracker/Token.tsx";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { characterMetadata, sceneMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import "./popover.scss";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";

export const Popover = () => {
    const [id, setId] = useState<string | null>(null);
    const { isReady } = SceneReadyContext();

    const initPopover = async () => {
        const selection = await OBR.player.getSelection();
        if (selection && selection.length === 1) {
            const items = await OBR.scene.items.getItems<Image>(selection);
            setId(items[0].id);
        }
    };

    useEffect(() => {
        if (isReady) {
            initPopover();
        }
    }, [isReady]);

    return <ContextWrapper>{id ? <Content id={id} /> : null}</ContextWrapper>;
};

const Content = (props: { id: string }) => {
    const id = props.id;
    const [data, setData] = useState<HpTrackerMetadata | null>(null);
    const [currentSceneMetadata, setCurrentSceneMetadata] = useState<SceneMetadata | null>(null);
    const [item, setItem] = useState<Item | null>(null);
    const { isReady } = SceneReadyContext();

    const getData = async () => {
        if (id) {
            const items = await OBR.scene.items.getItems([id]);
            if (items.length > 0) {
                const item = items[0];
                if (characterMetadata in item.metadata) {
                    setData(item.metadata[characterMetadata] as HpTrackerMetadata);
                    setItem(item);
                }
            }
        }

        return null;
    };

    const initPopover = async () => {
        await getData();
        const metadata = await OBR.scene.getMetadata();
        const data = metadata[sceneMetadata] as SceneMetadata;
        if (data) {
            setCurrentSceneMetadata(data);
        }
    };

    useEffect(() => {
        OBR.scene.items.onChange(async (items) => {
            const filteredItems = items.filter((item) => item.id === id);
            if (filteredItems.length > 0) {
                const item = filteredItems[0];
                if (characterMetadata in item.metadata) {
                    setData(item.metadata[characterMetadata] as HpTrackerMetadata);
                }
            }
        });

        OBR.scene.onMetadataChange((sceneData) => {
            const metadata = sceneData[sceneMetadata] as SceneMetadata;
            if (metadata) {
                setCurrentSceneMetadata(metadata);
            }
        });
    }, []);

    useEffect(() => {
        if (isReady) {
            initPopover();
        }
    }, [isReady]);

    return id && data && currentSceneMetadata && item ? (
        <div className={"popover"}>
            <Token item={item} data={data} popover={true} selected={false} metadata={currentSceneMetadata} />
        </div>
    ) : null;
};
