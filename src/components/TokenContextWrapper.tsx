import { PropsWithChildren, useEffect } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../helper/variables.ts";
import { HpTrackerMetadata } from "../helper/types.ts";
import { SceneReadyContext } from "../context/SceneReadyContext.ts";
import { useTokenListContext } from "../context/TokenContext.tsx";

export const TokenContextWrapper = (props: PropsWithChildren) => {
    const { isReady } = SceneReadyContext();
    const setTokens = useTokenListContext((state) => state.setTokens);
    const initTokens = async () => {
        const initialItems = await OBR.scene.items.getItems(
            (item) =>
                itemMetadataKey in item.metadata &&
                (item.metadata[itemMetadataKey] as HpTrackerMetadata).hpTrackerActive
        );
        setTokens(initialItems);
    };

    useEffect(() => {
        if (isReady) {
            initTokens();

            return OBR.scene.items.onChange(async (items) => {
                const filteredItems = items.filter(
                    (item) =>
                        itemMetadataKey in item.metadata &&
                        (item.metadata[itemMetadataKey] as HpTrackerMetadata).hpTrackerActive
                );
                setTokens(Array.from(filteredItems));
            });
        }
    }, [isReady]);

    return <>{props.children}</>;
};