import React from "react";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import { Draggable } from "react-beautiful-dnd";
import { Token } from "./Token/Token.tsx";

type TokenListProps = {
    tokens: Item[];
    selected: Array<string>;
    tokenLists: Map<string, Array<Item>>;
};

export const DraggableTokenList = React.memo(function DraggableTokenList(props: TokenListProps) {
    const updateTokenIndex = (id: string, index: number) => {
        OBR.scene.items.updateItems([id], (items) => {
            items.forEach((item) => {
                const data = item.metadata[itemMetadataKey] as HpTrackerMetadata;

                data.index = index;

                item.metadata[itemMetadataKey] = { ...data };
            });
        });
    };

    return (
        <>
            {props.tokens.length > 0 ? (
                <>
                    <div className={"draggable-token-list-wrapper"}>
                        <div className={"draggable-token-list-wrapper"}>
                            {props.tokens?.map((token, index) => {
                                const data = token.metadata[itemMetadataKey] as HpTrackerMetadata;
                                if (data) {
                                    if (data.index === undefined) {
                                        updateTokenIndex(token.id, index);
                                    }
                                    return (
                                        <Draggable key={token.id} draggableId={token.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <Token
                                                        id={token.id}
                                                        popover={false}
                                                        selected={props.selected.includes(token.id)}
                                                        tokenLists={props.tokenLists}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    </div>
                    <div className={"empty-group"}></div>
                </>
            ) : (
                <div className={"empty-group"}></div>
            )}
        </>
    );
});

export const PlayerTokenList = (props: TokenListProps) => {
    return (
        <>
            {props.tokens.map((token) => {
                const data = token.metadata[itemMetadataKey] as HpTrackerMetadata;
                if (data) {
                    return (
                        <Token
                            key={token.id}
                            id={token.id}
                            popover={false}
                            selected={props.selected.includes(token.id)}
                            tokenLists={props.tokenLists}
                        />
                    );
                }
            })}
        </>
    );
};
