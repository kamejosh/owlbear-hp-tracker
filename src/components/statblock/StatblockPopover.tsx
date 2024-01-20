import { itemMetadataKey, statblockPopoverId } from "../../helper/variables.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { StatblockList } from "./StatblockList.tsx";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import { sortItems } from "../../helper/helpers.ts";
import { DiceTray } from "../general/DiceTray.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";

export const StatblockPopover = () => {
    const [minimized, setMinimized] = useState<boolean>(false);
    const [tokens, setTokens] = useState<Array<Item>>([]);
    const [sortedTokens, setSortedTokens] = useState<Array<Item>>([]);
    const [pinned, setPinned] = useState<boolean>(false);
    const [data, setData] = useState<HpTrackerMetadata | null>(null);
    const { room, scene } = useMetadataContext();
    const { isReady } = SceneReadyContext();

    const initPopover = async () => {
        const initialItems = await OBR.scene.items.getItems(
            (item) =>
                itemMetadataKey in item.metadata &&
                (item.metadata[itemMetadataKey] as HpTrackerMetadata).hpTrackerActive &&
                (item.metadata[itemMetadataKey] as HpTrackerMetadata).sheet !== ""
        );
        setTokens(initialItems.sort(sortItems));

        OBR.scene.items.onChange(async (items) => {
            const filteredItems = items.filter(
                (item) =>
                    itemMetadataKey in item.metadata &&
                    (item.metadata[itemMetadataKey] as HpTrackerMetadata).hpTrackerActive &&
                    (item.metadata[itemMetadataKey] as HpTrackerMetadata).sheet !== ""
            );
            setTokens(Array.from(filteredItems.sort(sortItems)));
        });

        OBR.player.onChange(async (player) => {
            if (player.selection && player.selection.length === 1) {
                const items = await OBR.scene.items.getItems(player.selection);
                if (items.length > 0) {
                    const metadata = items[0].metadata;
                    if (itemMetadataKey in metadata) {
                        const data = metadata[itemMetadataKey] as HpTrackerMetadata;
                        setData(data);
                    }
                }
            }
        });
    };

    useEffect(() => {
        if (!minimized && isReady) {
            OBR.popover.setHeight(statblockPopoverId, room?.statblockPopover?.height || 600);
            OBR.popover.setWidth(statblockPopoverId, room?.statblockPopover?.width || 500);
        }
    }, [room, isReady]);

    useEffect(() => {
        let tempList: Array<Item> = [];

        scene?.groups?.forEach((group) => {
            const groupItems = tokens?.filter((item) => {
                const metadata = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                return (
                    (!metadata.group && group === "Default") ||
                    metadata.group === group ||
                    (!scene?.groups?.includes(metadata.group ?? "") && group === "Default")
                );
            });
            tempList = tempList.concat(groupItems ?? []);
        });

        setSortedTokens(tempList);
    }, [scene?.groups, tokens]);

    useEffect(() => {
        if (isReady) {
            initPopover();
        }
    }, [isReady]);

    return (
        <ContextWrapper>
            <div className={"statblock-popover"}>
                <div className={"help-buttons"}>
                    <button
                        className={"top-button"}
                        onClick={() => {
                            if (minimized) {
                                OBR.popover.setHeight(statblockPopoverId, room?.statblockPopover?.height || 600);
                            } else {
                                OBR.popover.setHeight(statblockPopoverId, 100);
                            }
                            setMinimized(!minimized);
                        }}
                        title={"minmize"}
                    >
                        {minimized ? <div className={"square"}></div> : "-"}
                    </button>
                    <button
                        className={"top-button"}
                        onClick={() => OBR.popover.close(statblockPopoverId)}
                        title={"close"}
                    >
                        X
                    </button>
                </div>
                <StatblockList
                    minimized={minimized}
                    tokens={sortedTokens}
                    pinned={pinned}
                    setPinned={setPinned}
                    data={data}
                />
            </div>
            <DiceTray classes={"statblock-dice-tray"} />
        </ContextWrapper>
    );
};
