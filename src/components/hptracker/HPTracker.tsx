import { useEffect, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import {
    changelogModal,
    characterMetadata,
    helpModal,
    sceneMetadata,
    settingsModal,
    version,
} from "../../helper/variables.ts";
import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import { DragDropContext, DraggableLocation, DropResult } from "react-beautiful-dnd";
import "./hp-tracker.scss";
import { PlayerTokenList } from "./TokenList.tsx";
import { useCharSheet } from "../../context/CharacterContext.ts";
import { CharacterSheet } from "./charactersheet/CharacterSheet.tsx";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { DropGroup } from "./DropGroup.tsx";
import { plausibleEvent, sortItems, sortItemsInitiative } from "../../helper/helpers.ts";
import { compare } from "compare-versions";

export const HPTracker = () => {
    return (
        <ContextWrapper>
            <Content />
        </ContextWrapper>
    );
};

const Content = () => {
    const playerContext = usePlayerContext();
    const [tokens, setTokens] = useState<Item[] | undefined>(undefined);
    const [playerTokens, setPlayerTokens] = useState<Array<Item>>([]);
    const [selectedTokens, setSelectedTokens] = useState<Array<string>>([]);
    const [tokenLists, setTokenLists] = useState<Map<string, Array<Item>>>(new Map());
    const [currentSceneMetadata, setCurrentSceneMetadata] = useState<SceneMetadata | null>(null);
    const { isReady } = SceneReadyContext();
    const { characterId } = useCharSheet();

    const initHpTracker = async () => {
        const initialItems = await OBR.scene.items.getItems(
            (item) =>
                characterMetadata in item.metadata &&
                (item.metadata[characterMetadata] as HpTrackerMetadata).hpTrackerActive
        );
        setTokens(initialItems);

        const sceneData = await OBR.scene.getMetadata();
        const metadata = sceneData[sceneMetadata] as SceneMetadata;
        if (metadata?.version && compare(metadata.version, version, "<")) {
            await OBR.modal.open({
                ...changelogModal,
                fullScreen: false,
                height: 600,
                width: 600,
            });
        }
        setCurrentSceneMetadata(metadata);
    };

    useEffect(() => {
        if (isReady) {
            initHpTracker();
        }
    }, [isReady]);

    useEffect(() => {
        OBR.scene.items.onChange(async (items) => {
            const filteredItems = items.filter(
                (item) =>
                    characterMetadata in item.metadata &&
                    (item.metadata[characterMetadata] as HpTrackerMetadata).hpTrackerActive
            );
            setTokens(Array.from(filteredItems));
        });
        OBR.scene.onMetadataChange((sceneData) => {
            const metadata = sceneData[sceneMetadata] as SceneMetadata;
            if (metadata) {
                setCurrentSceneMetadata(metadata);
            }
        });
        OBR.player.onChange((player) => {
            setSelectedTokens(player.selection ?? []);
        });
    }, []);

    useEffect(() => {
        const tokenMap = new Map<string, Array<Item>>();

        currentSceneMetadata?.groups?.forEach((group) => {
            const groupItems = tokens?.filter((item) => {
                const metadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                return (
                    (!metadata.group && group === "Default") ||
                    metadata.group === group ||
                    (!currentSceneMetadata?.groups?.includes(metadata.group ?? "") && group === "Default")
                );
            });
            tokenMap.set(group, groupItems ?? []);
        });

        setTokenLists(tokenMap);
    }, [currentSceneMetadata?.groups, tokens]);

    useEffect(() => {
        if (currentSceneMetadata?.playerSort && tokens) {
            const localTokens = [...tokens];
            setPlayerTokens(localTokens.sort(sortItemsInitiative));
        } else {
            setPlayerTokens(tokens ?? []);
        }
    }, [currentSceneMetadata?.playerSort, tokens]);

    const reorderMetadataIndex = (list: Array<Item>, group?: string) => {
        OBR.scene.items.updateItems(list, (items) => {
            items.forEach((item, index) => {
                const data = item.metadata[characterMetadata] as HpTrackerMetadata;
                data.index = index;
                if (group) {
                    data.group = group;
                }
                item.metadata[characterMetadata] = { ...data };
            });
        });
    };

    const reorder = (list: Item[], startIndex: number, endIndex: number) => {
        const result = Array.from(list);
        result.sort(sortItems);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        const tokens = result.filter((item) => item !== undefined);

        reorderMetadataIndex(tokens);
    };

    const move = (
        source: Array<Item>,
        destination: Array<Item>,
        droppableSource: DraggableLocation,
        droppableDestination: DraggableLocation
    ) => {
        const sourceClone = Array.from(source);
        const destClone = Array.from(destination);
        const [removed] = sourceClone.splice(droppableSource.index, 1);

        destClone.splice(droppableDestination.index, 0, removed);

        reorderMetadataIndex(sourceClone);
        reorderMetadataIndex(destClone, droppableDestination.droppableId);
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
                result.destination
            );
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        reorder(tokenLists.get(result.destination.droppableId) ?? [], result.source.index, result.destination.index);
    };

    const orderByInitiative = () => {
        tokenLists.forEach((tokenList) => {
            const reordered = Array.from(tokenList);
            reordered.sort((a, b) => {
                const aData = a.metadata[characterMetadata] as HpTrackerMetadata;
                const bData = b.metadata[characterMetadata] as HpTrackerMetadata;
                if (bData.initiative === aData.initiative) {
                    return (
                        bData.stats.initiativeBonus +
                        bData.initiative -
                        (aData.stats.initiativeBonus + aData.initiative)
                    );
                }
                return bData.initiative - aData.initiative;
            });
            reorderMetadataIndex(reordered);
        });
    };

    return playerContext.role ? (
        characterId ? (
            <CharacterSheet />
        ) : (
            <div className={"hp-tracker"}>
                <div className={"help-buttons"}>
                    <a
                        href={"https://www.patreon.com/TTRPGAPI"}
                        className={"patreon-button"}
                        target={"_blank"}
                        onClick={() => {
                            plausibleEvent("patreon-click");
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 436 476">
                            <path
                                data-fill="1"
                                d="M436 143c-.084-60.778-47.57-110.591-103.285-128.565C263.528-7.884 172.279-4.649 106.214 26.424 26.142 64.089.988 146.596.051 228.883c-.77 67.653 6.004 245.841 106.83 247.11 74.917.948 86.072-95.279 120.737-141.623 24.662-32.972 56.417-42.285 95.507-51.929C390.309 265.865 436.097 213.011 436 143Z"
                                fill={"#dddddd"}
                            ></path>
                        </svg>
                    </a>
                    {playerContext.role == "GM" ? (
                        <button className={"settings-button"} onClick={async () => await OBR.modal.open(settingsModal)}>
                            ⛭
                        </button>
                    ) : null}
                    <button className={"change-log-button"} onClick={async () => await OBR.modal.open(changelogModal)}>
                        i
                    </button>
                    <button className={"help-button"} onClick={async () => await OBR.modal.open(helpModal)}>
                        ?
                    </button>
                </div>
                <h1 className={"title"}>
                    HP Tracker<span className={"small"}>{version}</span>
                </h1>
                <div className={`player-wrapper headings ${playerContext.role === "PLAYER" ? "player" : ""}`}>
                    <span>Name</span>
                    {playerContext.role === "GM" ? <span>Settings</span> : null}
                    <span className={"current-hp"}>HP / MAX</span>
                    <span className={"temp-hp"}>TMP</span>
                    <span className={"armor-class"}>AC</span>
                    <span className={"initiative-wrapper"}>
                        INIT
                        {playerContext.role === "GM" ? (
                            <button
                                className={"sort-button settings-button"}
                                title={"Order By Initiative"}
                                onClick={orderByInitiative}
                            >
                                ↓
                            </button>
                        ) : null}
                    </span>
                    <span className={"character-sheet"}>INFO</span>
                </div>
                {playerContext.role === "GM" && currentSceneMetadata ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        {currentSceneMetadata.groups && currentSceneMetadata.groups?.length > 0 ? (
                            currentSceneMetadata.groups?.map((group) => {
                                const list = tokenLists.get(group) || [];
                                return (
                                    <DropGroup
                                        key={group}
                                        title={group}
                                        list={list.sort(sortItems)}
                                        selected={selectedTokens}
                                        metadata={currentSceneMetadata}
                                    />
                                );
                            })
                        ) : (
                            <DropGroup
                                title={"Default"}
                                list={Array.from(tokens ?? []).sort(sortItems)}
                                selected={selectedTokens}
                                metadata={currentSceneMetadata}
                            />
                        )}
                    </DragDropContext>
                ) : (
                    <PlayerTokenList tokens={playerTokens} selected={selectedTokens} metadata={currentSceneMetadata!} />
                )}
            </div>
        )
    ) : (
        <h1>Waiting for OBR startup</h1>
    );
};
