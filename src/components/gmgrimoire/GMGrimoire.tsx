import { useEffect, useMemo, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { changelogModal, itemMetadataKey, version } from "../../helper/variables.ts";
import { GMGMetadata, SORT } from "../../helper/types.ts";
import { PlayerTokenList } from "./TokenList.tsx";
import { useCharSheet } from "../../context/CharacterContext.ts";
import { CharacterSheet } from "./statblocks/CharacterSheet.tsx";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { DropGroup } from "./DropGroup.tsx";
import {
    modulo,
    orderByInitiative,
    reorderMetadataIndex,
    sortItems,
    sortItemsInitiative,
    updateSceneMetadata,
} from "../../helper/helpers.ts";
import { compare } from "compare-versions";
import { Helpbuttons } from "../general/Helpbuttons/Helpbuttons.tsx";
import { DiceTray } from "../general/DiceRoller/DiceTray.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { isUndefined } from "lodash";
import { TokenContextWrapper } from "../TokenContextWrapper.tsx";
import { useTokenListContext } from "../../context/TokenContext.tsx";
import { PlayerSvg } from "../svgs/PlayerSvg.tsx";
import { InitiativeSvg } from "../svgs/InitiativeSvg.tsx";
import { ArrowSvg } from "../svgs/ArrowSvg.tsx";
import { useUISettingsContext } from "../../context/UISettingsContext.ts";
import { BattleRounds } from "./Token/BattleRounds.tsx";
import { DraggableLocation, DropResult, DragDropContext } from "@hello-pangea/dnd";
import Tippy from "@tippyjs/react";
import { updateItems } from "../../helper/obrHelper.ts";
import { useShallow } from "zustand/react/shallow";
import { FocusSvg } from "../svgs/FocusSvg.tsx";

export const GMGrimoire = () => {
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
    const tokens = useTokenListContext(useShallow((state) => state.tokens));

    const [selectedTokens, setSelectedTokens] = useState<Array<string>>([]);
    const [ignoredChanges, setIgnoredChanges] = useState<boolean>(false);
    const [scene, room] = useMetadataContext(useShallow((state) => [state.scene, state.room]));
    const sortInitiative = scene?.sortMethod ?? SORT.DESC;
    const enableAutoSort = !!scene?.enableAutoSort;
    const { isReady } = SceneReadyContext();
    const characterId = useCharSheet(useShallow((state) => state.characterId));
    const [playerPreview, setPlayerPreview, battleFocus, setBattleFocus] = useUISettingsContext(
        useShallow((state) => [state.playerPreview, state.setPlayerPreview, state.battleFocus, state.setBattleFocus]),
    );

    useEffect(() => {
        const resizeActionWindow = async () => {
            if (playerContext.role === "GM") {
                if (battleFocus) {
                    await OBR.action.setWidth(410);
                } else {
                    await OBR.action.setWidth(570);
                }
            }
        };

        resizeActionWindow();
    }, [battleFocus, playerContext.role]);

    useEffect(() => {
        const initGrimoire = async () => {
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
                await OBR.notification.show(`GM's Grimoire has been updated to version ${version}`, "SUCCESS");
            }
            if (scene && scene?.version && compare(scene.version, version, "<")) {
                await updateSceneMetadata(scene, { version: version });
            }
        };

        const initAction = async () => {
            if (playerContext.role === "PLAYER") {
                await OBR.action.setHeight(700);
                await OBR.action.setWidth(560);
            }
        };

        if (isReady) {
            void initGrimoire();
            void initAction();
        }
    }, [isReady]);

    useEffect(() => {
        return OBR.player.onChange((player) => {
            setSelectedTokens(player.selection ?? []);
        });
    }, []);

    const items = useMemo(() => (tokens ? [...tokens].map((t) => t[1].item) : []), [tokens]);

    const tokenLists = useMemo(() => {
        const tokenMap = new Map<string, Array<Image>>();

        if (isReady && scene?.groups) {
            for (const group of scene?.groups) {
                const groupItems = items?.filter((item) => {
                    const metadata = item.metadata[itemMetadataKey] as GMGMetadata;
                    return (
                        (!metadata.group && group === "Default") ||
                        metadata.group === group ||
                        (!scene?.groups?.includes(metadata.group ?? "") && group === "Default")
                    );
                });
                tokenMap.set(group, groupItems ?? []);
            }
        }
        return tokenMap;
    }, [scene?.groups, items, isReady]);

    useEffect(() => {
        if (playerContext.role === "GM" && enableAutoSort) {
            orderByInitiative(tokenLists, sortInitiative === SORT.ASC);
        }
    }, [enableAutoSort, sortInitiative, tokenLists]);

    const playerTokens = useMemo(() => {
        const playerItems = Array.from(items);
        if (room?.playerSort && playerItems) {
            if (sortInitiative === SORT.ASC) {
                return playerItems.sort(sortItemsInitiative).reverse();
            } else {
                return playerItems.sort(sortItemsInitiative);
            }
        } else {
            return playerItems ?? [];
        }
    }, [room?.playerSort, items, sortInitiative]);

    const reorderMetadataIndexMulti = async (destList: Array<Item>, group: string, sourceList: Array<Item>) => {
        const combinedList = destList.concat(sourceList);
        const destinationIds = destList.map((d) => d.id);
        await updateItems(
            combinedList.map((i) => i.id),
            (items) => {
                let destIndex = 0;
                let sourceIndex = 0;
                items.forEach((item) => {
                    const data = item.metadata[itemMetadataKey] as GMGMetadata;
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
            },
        );
    };

    const reorder = async (
        list: Array<Image>,
        startIndex: number,
        endIndex: number,
        dragItem: DropResult,
        multiMove: boolean = false,
    ) => {
        const result = Array.from(list);
        result.sort(sortItems);
        const [removed] = result.splice(startIndex, 1);
        const multiRemove: Array<Image> = [removed];

        if (multiMove) {
            const alsoSelected = result.filter(
                (item) => selectedTokens.includes(item.id) && item.id != dragItem.draggableId,
            );

            let localRemove: Array<Image> = [];

            alsoSelected.forEach((item) => {
                localRemove = localRemove.concat(
                    result.splice(
                        result.findIndex((sourceItem) => sourceItem.id === item.id),
                        1,
                    ),
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

        await reorderMetadataIndex(tokens);
    };

    const move = async (
        source: Array<Item>,
        destination: Array<Item>,
        droppableSource: DraggableLocation,
        droppableDestination: DraggableLocation,
        result: DropResult,
        multiMove: boolean = false,
    ) => {
        const sourceClone = Array.from(source);
        const destClone = Array.from(destination);
        const [removed] = sourceClone.splice(droppableSource.index, 1);
        const multiRemove: Array<Item> = [removed];

        if (multiMove) {
            const alsoSelected = source.filter(
                (item) => selectedTokens.includes(item.id) && item.id != result.draggableId,
            );

            let localRemove: Array<Item> = [];

            alsoSelected.forEach((item) => {
                localRemove = localRemove.concat(
                    sourceClone.splice(
                        sourceClone.findIndex((sourceItem) => sourceItem.id === item.id),
                        1,
                    ),
                );
            });

            localRemove = localRemove.concat(multiRemove);

            localRemove.forEach((item) => {
                destClone.splice(droppableDestination.index, 0, item);
            });
        } else {
            destClone.splice(droppableDestination.index, 0, removed);
        }

        await reorderMetadataIndexMulti(destClone, droppableDestination.droppableId, sourceClone);
    };

    const onDragEnd = async (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        if (result.source.droppableId != result.destination.droppableId) {
            await move(
                tokenLists.get(result.source.droppableId) || [],
                tokenLists.get(result.destination.droppableId) || [],
                result.source,
                result.destination,
                result,
                selectedTokens.includes(result.draggableId),
            );
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        await reorder(
            tokenLists.get(result.destination.droppableId) ?? [],
            result.source.index,
            result.destination.index,
            result,
            selectedTokens.includes(result.draggableId),
        );
    };

    return playerContext.role ? (
        characterId ? (
            <CharacterSheet itemId={characterId} />
        ) : (
            <div className={`gm-grimoire ${playerContext.role === "PLAYER" ? "player" : ""}`}>
                <Helpbuttons ignoredChanges={ignoredChanges} setIgnoredChange={setIgnoredChanges} />

                {playerContext.role === "PLAYER" ? (
                    <h1 className={"title"}>
                        GM's Grimoire <span className={"small"}>{version}</span>
                    </h1>
                ) : null}
                {playerContext.role === "GM" ? (
                    <div className={"ui-buttons"}>
                        <div className={`headings`}>
                            <Tippy content={"Toggle Player Preview Mode"}>
                                <button
                                    className={`toggle-preview ${playerPreview ? "active" : ""}`}
                                    onClick={() => {
                                        setPlayerPreview(!playerPreview);
                                    }}
                                >
                                    <PlayerSvg />
                                </button>
                            </Tippy>
                            <Tippy content={"Toggle Battle Focus"}>
                                <button
                                    className={`toggle-battle-focus ${battleFocus ? "active" : ""}`}
                                    onClick={() => {
                                        setBattleFocus(!battleFocus);
                                    }}
                                >
                                    <FocusSvg />
                                </button>
                            </Tippy>
                            <span className={"initiative-order"}>
                                <InitiativeSvg />
                                <Tippy content={"Toggle Initiative Auto Sorting"}>
                                    <button
                                        className={`sort-toggle button ${enableAutoSort ? "active" : ""}`}
                                        onClick={async () => {
                                            const autoSort = !scene?.enableAutoSort;
                                            await updateSceneMetadata(scene, { enableAutoSort: autoSort });
                                        }}
                                    ></button>
                                </Tippy>
                                <Tippy content={"Initiative Order"}>
                                    <button
                                        className={`sort-button button ${sortInitiative == SORT.DESC ? "reverse" : ""}`}
                                        disabled={!enableAutoSort}
                                        title={"Order By Initiative"}
                                        onClick={async () => {
                                            const newOrder = !isUndefined(sortInitiative)
                                                ? modulo(sortInitiative + 1, 2)
                                                : SORT.DESC;
                                            await updateSceneMetadata(scene, {
                                                sortMethod: newOrder,
                                            });
                                        }}
                                    >
                                        <ArrowSvg />
                                    </button>
                                </Tippy>
                            </span>
                        </div>
                        <BattleRounds />
                    </div>
                ) : null}
                <div className={"grimoire-content"}>
                    {playerContext.role === "GM" ? (
                        <>
                            <div className={"gmg-name"}>
                                <span>Game Master's Grimoire </span>
                                <span className={"small"}>{version}</span>
                            </div>
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
                        </>
                    ) : (
                        <PlayerTokenList tokens={playerTokens} selected={selectedTokens} tokenLists={tokenLists} />
                    )}
                </div>
            </div>
        )
    ) : (
        <h1>Waiting for OBR startup</h1>
    );
};
