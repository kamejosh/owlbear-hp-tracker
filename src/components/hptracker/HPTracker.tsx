import React, { useEffect, useRef, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { characterMetadata, sceneMetadata, version } from "../../helper/variables.ts";
import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import { DragDropContext, DraggableLocation, DropResult } from "react-beautiful-dnd";
import "./hp-tracker.scss";
import { PlayerTokenList } from "./TokenList.tsx";
import { useCharSheet } from "../../context/CharacterContext.ts";
import { CharacterSheet } from "./charactersheet/CharacterSheet.tsx";
import { GlobalSettings } from "./globalsettings/GlobalSettings.tsx";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { DropGroup } from "./DropGroup.tsx";
import { sortItems } from "../../helper/helpers.ts";
import changelog from "../../../CHANGELOG.md";
import ReactMarkdown from "react-markdown";

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
    const [selectedTokens, setSelectedTokens] = useState<Array<string>>([]);
    const [tokenLists, setTokenLists] = useState<Map<string, Array<Item>>>(new Map());
    const [currentSceneMetadata, setCurrentSceneMetadata] = useState<SceneMetadata | null>(null);
    const [changelogText, setChangelogText] = useState<string>("");
    const dialogRef = useRef<HTMLDialogElement>(null);
    const { isReady } = SceneReadyContext();
    const { characterId } = useCharSheet();

    const initHpTracker = async () => {
        const initialItems = await OBR.scene.items.getItems(
            (item) =>
                (item.layer === "CHARACTER" || item.layer === "MOUNT") &&
                characterMetadata in item.metadata &&
                (item.metadata[characterMetadata] as HpTrackerMetadata).hpTrackerActive
        );
        setTokens(initialItems);

        const sceneData = await OBR.scene.getMetadata();
        const metadata = sceneData[sceneMetadata] as SceneMetadata;
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
                    (item.layer === "CHARACTER" || item.layer === "MOUNT") &&
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
        fetch(changelog)
            .then((res) => res.text())
            .then((text) => setChangelogText(text));
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

    return playerContext.role ? (
        characterId ? (
            <CharacterSheet />
        ) : (
            <div className={"hp-tracker"}>
                <button className={"change-log-button"} onClick={() => dialogRef.current?.showModal()}>
                    ?
                </button>
                <dialog ref={dialogRef} className={"changelog"}>
                    <button className={"change-log-button close"} onClick={() => dialogRef.current?.close()}>
                        X
                    </button>
                    <ReactMarkdown children={changelogText} />
                </dialog>
                <h1 className={"title"}>
                    HP Tracker<span className={"small"}>{version}</span>
                </h1>
                {playerContext.role === "GM" && !!currentSceneMetadata?.id ? (
                    <GlobalSettings sceneId={currentSceneMetadata.id} />
                ) : null}
                <div className={`player-wrapper headings ${playerContext.role === "PLAYER" ? "player" : ""}`}>
                    <span>Name</span>
                    {playerContext.role === "GM" ? <span>Settings</span> : null}
                    <span className={"current-hp"}>HP / MAX</span>
                    <span className={"armor-class"}>AC</span>
                    <span className={"initiative-wrapper"}>INIT</span>
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
                    <PlayerTokenList tokens={tokens ?? []} selected={selectedTokens} metadata={currentSceneMetadata!} />
                )}
            </div>
        )
    ) : (
        <h1>Waiting for OBR startup</h1>
    );
};
