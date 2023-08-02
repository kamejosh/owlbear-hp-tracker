import React, { useEffect, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import { DragDropContext, Droppable, DropResult } from "react-beautiful-dnd";
import "./hp-tracker.scss";
import { DraggableTokenList, PlayerTokenList } from "./TokenList.tsx";
import { useCharSheet } from "../../context/CharacterContext.ts";
import { CharacterSheet } from "./charactersheet/CharacterSheet.tsx";

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
    const [isReady, setIsReady] = useState<boolean>(false);
    const { characterId } = useCharSheet();

    const initHpTracker = async () => {
        const initialItems = await OBR.scene.items.getItems(
            (item) =>
                item.layer === "CHARACTER" &&
                characterMetadata in item.metadata &&
                (item.metadata[characterMetadata] as HpTrackerMetadata).hpTrackerActive
        );
        setTokens(initialItems);

        OBR.scene.items.onChange(async (items) => {
            const filteredItems = items.filter(
                (item) =>
                    item.layer === "CHARACTER" &&
                    characterMetadata in item.metadata &&
                    (item.metadata[characterMetadata] as HpTrackerMetadata).hpTrackerActive
            );
            setTokens(Array.from(filteredItems));
        });
    };

    const initIsReady = async () => {
        setIsReady(await OBR.scene.isReady());
    };

    useEffect(() => {
        OBR.scene.onReadyChange(async (ready) => {
            setIsReady(ready);
        });
        initIsReady();
    }, []);

    useEffect(() => {
        if (isReady) {
            initHpTracker();
        }
    }, [isReady]);

    const sortItems = (a: Item, b: Item) => {
        const aData = a.metadata[characterMetadata] as HpTrackerMetadata;
        const bData = b.metadata[characterMetadata] as HpTrackerMetadata;
        if (aData && bData && aData.index !== undefined && bData.index !== undefined) {
            if (aData.index < bData.index) {
                return -1;
            } else if (aData.index > bData.index) {
                return 1;
            } else {
                return 0;
            }
        }
        return 0;
    };

    const sortedTokens = Array.from(tokens ?? []).sort(sortItems);

    /*    const listInfo = (list: Array<Item>) => {
        return list.map((token) => {
            const data = token.metadata[characterMetadata] as HpTrackerMetadata;

            return [data.name, data.index];
        });
    };*/

    const reorder = (list: Item[], startIndex: number, endIndex: number) => {
        const result = Array.from(list);
        result.sort(sortItems);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        const tokens = result.filter((item) => item !== undefined);

        OBR.scene.items.updateItems(tokens, (items) => {
            items.forEach((item, index) => {
                const data = item.metadata[characterMetadata] as HpTrackerMetadata;
                data.index = index;
                console.log(data.name, index);

                item.metadata[characterMetadata] = { ...data };
            });
        });
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        reorder(tokens ?? [], result.source.index, result.destination.index);
    };

    return playerContext.role ? (
        characterId ? (
            <CharacterSheet />
        ) : (
            <div className={"hp-tracker"}>
                <h1 className={"title"}>HP Tracker</h1>
                <div className={`player-wrapper headings ${playerContext.role === "PLAYER" ? "player" : ""}`}>
                    <span>Name</span>
                    {playerContext.role === "GM" ? <span>Settings</span> : null}
                    <span className={"current-hp"}>HP / MAX</span>
                    <span className={"armor-class"}>AC</span>
                    <span className={"initiative-wrapper"}>INIT</span>
                    <span className={"character-sheet"}>INFO</span>
                </div>
                {playerContext.role === "GM" ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                        <Droppable droppableId={"tokens"}>
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps}>
                                    <DraggableTokenList tokens={sortedTokens} />
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                ) : (
                    <PlayerTokenList tokens={tokens ?? []} />
                )}
            </div>
        )
    ) : (
        <h1>Waiting for OBR startup</h1>
    );
};
