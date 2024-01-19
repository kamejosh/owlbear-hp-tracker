import { characterMetadata, sceneMetadata, statblockPopoverId } from "../../helper/variables.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { StatblockList } from "./StatblockList.tsx";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import { sortItems } from "../../helper/helpers.ts";
import { DiceTray } from "../general/DiceTray.tsx";

export const StatblockPopover = () => {
    const [minimized, setMinimized] = useState<boolean>(false);
    const [tokens, setTokens] = useState<Array<Item>>([]);
    const [sortedTokens, setSortedTokens] = useState<Array<Item>>([]);
    const [currentSceneMetadata, setCurrentSceneMetadata] = useState<SceneMetadata | null>(null);
    const [pinned, setPinned] = useState<boolean>(false);
    const [data, setData] = useState<HpTrackerMetadata | null>(null);
    const { isReady } = SceneReadyContext();

    const initPopover = async () => {
        const initialItems = await OBR.scene.items.getItems(
            (item) =>
                characterMetadata in item.metadata &&
                (item.metadata[characterMetadata] as HpTrackerMetadata).hpTrackerActive &&
                (item.metadata[characterMetadata] as HpTrackerMetadata).sheet !== ""
        );
        setTokens(initialItems.sort(sortItems));

        const sceneData = await OBR.scene.getMetadata();
        const metadata = sceneData[sceneMetadata] as SceneMetadata;
        setCurrentSceneMetadata(metadata);

        OBR.scene.items.onChange(async (items) => {
            const filteredItems = items.filter(
                (item) =>
                    characterMetadata in item.metadata &&
                    (item.metadata[characterMetadata] as HpTrackerMetadata).hpTrackerActive &&
                    (item.metadata[characterMetadata] as HpTrackerMetadata).sheet !== ""
            );
            setTokens(Array.from(filteredItems.sort(sortItems)));
        });

        OBR.scene.onMetadataChange((sceneData) => {
            const metadata = sceneData[sceneMetadata] as SceneMetadata;
            if (metadata) {
                setCurrentSceneMetadata(metadata);
                if (!minimized) {
                    OBR.popover.setHeight(statblockPopoverId, metadata.statblockPopover?.height || 600);
                    OBR.popover.setWidth(statblockPopoverId, metadata.statblockPopover?.width || 500);
                }
            }
        });

        OBR.player.onChange(async (player) => {
            if (player.selection && player.selection.length === 1) {
                const items = await OBR.scene.items.getItems(player.selection);
                if (items.length > 0) {
                    const metadata = items[0].metadata;
                    if (characterMetadata in metadata) {
                        const data = metadata[characterMetadata] as HpTrackerMetadata;
                        setData(data);
                    }
                }
            }
        });
    };

    useEffect(() => {
        let tempList: Array<Item> = [];

        currentSceneMetadata?.groups?.forEach((group) => {
            const groupItems = tokens?.filter((item) => {
                const metadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                return (
                    (!metadata.group && group === "Default") ||
                    metadata.group === group ||
                    (!currentSceneMetadata?.groups?.includes(metadata.group ?? "") && group === "Default")
                );
            });
            tempList = tempList.concat(groupItems ?? []);
        });

        setSortedTokens(tempList);
    }, [currentSceneMetadata?.groups, tokens]);

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
                                OBR.popover.setHeight(
                                    statblockPopoverId,
                                    currentSceneMetadata?.statblockPopover?.height || 600
                                );
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
                    currentSceneMetadata={currentSceneMetadata}
                />
            </div>
            <DiceTray classes={"statblock-dice-tray"} />
        </ContextWrapper>
    );
};
