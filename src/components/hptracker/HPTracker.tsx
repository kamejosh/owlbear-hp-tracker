import { useCallback, useEffect, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { changelogModal, itemMetadataKey, version } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import { DragDropContext, DraggableLocation, DropResult } from "react-beautiful-dnd";
import { PlayerTokenList } from "./TokenList.tsx";
import { useCharSheet } from "../../context/CharacterContext.ts";
import { CharacterSheet } from "./charactersheet/CharacterSheet.tsx";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { DropGroup } from "./DropGroup.tsx";
import { sortItems, sortItemsInitiative } from "../../helper/helpers.ts";
import { compare } from "compare-versions";
import { Helpbuttons } from "../general/Helpbuttons/Helpbuttons.tsx";
import { DiceTray } from "../general/DiceRoller/DiceTray.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { uniq } from "lodash";
import { TokenContextWrapper } from "../TokenContextWrapper.tsx";
import { useTokenListContext } from "../../context/TokenContext.tsx";
import { PlayerSvg } from "../svgs/PlayerSvg.tsx";
import tippy from "tippy.js";

export const HPTracker = () => {
    return (
        <ContextWrapper component={"action_window"}>
            <TokenContextWrapper>
                <Content />
                <DiceTray classes={"hp-tracker-dice-tray"} />
            </TokenContextWrapper>
        </ContextWrapper>
    );
};

const Content = () => {
    const playerContext = usePlayerContext();
    const tokens = useTokenListContext((state) => state.tokens);
    const items = tokens ? [...tokens].map((t) => t[1].item) : [];
    const [selectedTokens, setSelectedTokens] = useState<Array<string>>([]);
    const [ignoredChanges, setIgnoredChanges] = useState<boolean>(false);
    const [scene, room] = useMetadataContext((state) => [state.scene, state.room]);
    const [reverseInitiativeOrder, setReverseInitiativeOrder] = useState<boolean>(false);
    const { isReady } = SceneReadyContext();
    const characterId = useCharSheet((state) => state.characterId);

    const initHpTracker = async () => {
        if (
            playerContext.role === "GM" &&
            !room?.ignoreUpdateNotification &&
            scene?.version &&
            compare(scene.version, version, "<")
        ) {
            const width = await OBR.viewport.getWidth();
            await OBR.modal.open({
                ...changelogModal,
                fullScreen: false,
                height: 600,
                width: Math.min(width * 0.9, 600),
            });
        } else if (playerContext.role === "GM" && scene?.version && compare(scene.version, version, "<")) {
            setIgnoredChanges(true);
            await OBR.notification.show(`HP Tracker has been updated to version ${version}`, "SUCCESS");
        }
    };

    useEffect(() => {
        if (isReady) {
            initHpTracker();
        }
    }, [isReady]);

    useEffect(() => {
        return OBR.player.onChange((player) => {
            setSelectedTokens(player.selection ?? []);
        });
    }, []);

    const reorderMetadataIndex = (list: Array<Item>, group?: string) => {
        OBR.scene.items.updateItems(list, (items) => {
            items.forEach((item, index) => {
                const data = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                data.index = index;
                if (group) {
                    data.group = group;
                }
                item.metadata[itemMetadataKey] = { ...data };
            });
        });
    };

    const tokenLists = useCallback(() => {
        const tokenMap = new Map<string, Array<Item>>();

        scene?.groups?.forEach((group) => {
            const groupItems = items?.filter((item) => {
                const metadata = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                return (
                    (!metadata.group && group === "Default") ||
                    metadata.group === group ||
                    (!scene?.groups?.includes(metadata.group ?? "") && group === "Default")
                );
            });
            const indices = groupItems?.map((gi) => (gi.metadata[itemMetadataKey] as HpTrackerMetadata).index);

            if (groupItems && indices && (indices.includes(undefined) || uniq(indices).length !== indices.length)) {
                reorderMetadataIndex(groupItems, group);
            } else {
                tokenMap.set(group, groupItems ?? []);
            }
        });
        return tokenMap;
    }, [scene?.groups, items])();

    const playerTokens = room?.playerSort && items ? [...items].sort(sortItemsInitiative) : items ?? [];

    const reorderMetadataIndexMulti = (destList: Array<Item>, group: string, sourceList: Array<Item>) => {
        const combinedList = destList.concat(sourceList);
        const destinationIds = destList.map((d) => d.id);
        OBR.scene.items.updateItems(combinedList, (items) => {
            let destIndex = 0;
            let sourceIndex = 0;
            items.forEach((item) => {
                const data = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                if (destinationIds.includes(item.id)) {
                    data.index = destIndex;
                    destIndex += 1;
                    data.group = group;
                } else {
                    data.index = sourceIndex;
                    sourceIndex += 1;
                }
                item.metadata[itemMetadataKey] = { ...data };
            });
        });
    };

    const reorder = (
        list: Item[],
        startIndex: number,
        endIndex: number,
        dragItem: DropResult,
        multiMove: boolean = false
    ) => {
        const result = Array.from(list);
        result.sort(sortItems);
        const [removed] = result.splice(startIndex, 1);
        const multiRemove: Array<Item> = [removed];

        if (multiMove) {
            const alsoSelected = result.filter(
                (item) => selectedTokens.includes(item.id) && item.id != dragItem.draggableId
            );

            let localRemove: Array<Item> = [];

            alsoSelected.forEach((item) => {
                localRemove = localRemove.concat(
                    result.splice(
                        result.findIndex((sourceItem) => sourceItem.id === item.id),
                        1
                    )
                );
            });

            localRemove = localRemove.concat(multiRemove);
            localRemove.forEach((item) => {
                result.splice(endIndex, 0, item);
            });
        } else {
            result.splice(endIndex, 0, removed);
        }
        const tokens = result.filter((item) => item !== undefined);

        reorderMetadataIndex(tokens);
    };

    const move = (
        source: Array<Item>,
        destination: Array<Item>,
        droppableSource: DraggableLocation,
        droppableDestination: DraggableLocation,
        result: DropResult,
        multiMove: boolean = false
    ) => {
        const sourceClone = Array.from(source);
        const destClone = Array.from(destination);
        const [removed] = sourceClone.splice(droppableSource.index, 1);
        const multiRemove: Array<Item> = [removed];

        if (multiMove) {
            const alsoSelected = source.filter(
                (item) => selectedTokens.includes(item.id) && item.id != result.draggableId
            );

            let localRemove: Array<Item> = [];

            alsoSelected.forEach((item) => {
                localRemove = localRemove.concat(
                    sourceClone.splice(
                        sourceClone.findIndex((sourceItem) => sourceItem.id === item.id),
                        1
                    )
                );
            });

            localRemove = localRemove.concat(multiRemove);

            localRemove.forEach((item) => {
                destClone.splice(droppableDestination.index, 0, item);
            });
        } else {
            destClone.splice(droppableDestination.index, 0, removed);
        }

        reorderMetadataIndexMulti(destClone, droppableDestination.droppableId, sourceClone);
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        if (result.source.droppableId != result.destination.droppableId) {
            move(
                tokenLists.get(result.source.droppableId) || [],
                tokenLists.get(result.destination.droppableId) || [],
                result.source,
                result.destination,
                result,
                selectedTokens.includes(result.draggableId)
            );
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        reorder(
            tokenLists.get(result.destination.droppableId) ?? [],
            result.source.index,
            result.destination.index,
            result,
            selectedTokens.includes(result.draggableId)
        );
    };

    const orderByInitiative = (reverse: boolean = false) => {
        tokenLists.forEach((tokenList) => {
            const reordered = Array.from(tokenList);
            reordered.sort((a, b) => {
                const aData = a.metadata[itemMetadataKey] as HpTrackerMetadata;
                const bData = b.metadata[itemMetadataKey] as HpTrackerMetadata;
                if (bData.initiative === aData.initiative) {
                    return (
                        bData.stats.initiativeBonus +
                        bData.initiative -
                        (aData.stats.initiativeBonus + aData.initiative)
                    );
                }
                return bData.initiative - aData.initiative;
            });
            if (reverse) {
                reordered.reverse();
            }
            reorderMetadataIndex(reordered);
        });
    };

    return playerContext.role ? (
        characterId ? (
            <CharacterSheet itemId={characterId} />
        ) : (
            <div className={"hp-tracker"}>
                <Helpbuttons ignoredChanges={ignoredChanges} setIgnoredChange={setIgnoredChanges} />
                <h1 className={"title"}>
                    HP Tracker<span className={"small"}>{version}</span>
                </h1>
                <div className={`headings ${playerContext.role === "PLAYER" ? "player" : ""}`}>
                    {playerContext.role === "GM" ? (
                        <>
                            <button
                                className={"toggle-preview"}
                                ref={(e) => {
                                    if (e) {
                                        tippy(e, { content: "Toogle Preview Mode" });
                                    }
                                }}
                            >
                                <PlayerSvg />
                            </button>
                            <span className={"initiative-order"}>
                                Sort by Initiative{" "}
                                <button
                                    className={`sort-button ${reverseInitiativeOrder ? "reverse" : ""}`}
                                    title={"Order By Initiative"}
                                    onClick={() => {
                                        orderByInitiative(reverseInitiativeOrder);
                                        setReverseInitiativeOrder(!reverseInitiativeOrder);
                                    }}
                                >
                                    ↓
                                </button>
                            </span>
                        </>
                    ) : null}
                </div>
                {playerContext.role === "GM" ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        {scene && scene.groups && scene.groups?.length > 0 ? (
                            scene.groups?.map((group) => {
                                const list = tokenLists.get(group) || [];
                                return (
                                    <DropGroup
                                        key={group}
                                        title={group}
                                        list={list.sort(sortItems)}
                                        selected={selectedTokens}
                                        tokenLists={tokenLists}
                                    />
                                );
                            })
                        ) : (
                            <DropGroup
                                title={"Default"}
                                list={Array.from(items ?? []).sort(sortItems)}
                                selected={selectedTokens}
                                tokenLists={tokenLists}
                            />
                        )}
                    </DragDropContext>
                ) : (
                    <PlayerTokenList tokens={playerTokens} selected={selectedTokens} tokenLists={tokenLists} />
                )}
            </div>
        )
    ) : (
        <h1>Waiting for OBR startup</h1>
    );
};
