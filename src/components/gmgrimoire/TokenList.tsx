import React from "react";
import { Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../helper/variables.ts";
import { GMGMetadata } from "../../helper/types.ts";
import { Draggable } from "@hello-pangea/dnd";
import { Token } from "./Token/Token.tsx";

type TokenListProps = {
    tokens: Item[];
    selected: Array<string>;
    tokenLists: Map<string, Array<Item>>;
};

export const DraggableTokenList = React.memo(function DraggableTokenList(props: TokenListProps) {
    return (
        <>
            {props.tokens.length > 0 ? (
                <>
                    <div className={"draggable-token-list-wrapper"}>
                        <div className={"draggable-token-list-wrapper"}>
                            {props.tokens?.map((token, index) => {
                                return (
                                    <Draggable key={token.id} draggableId={token.id} index={index}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                <Token
                                                    isDragging={snapshot.isDragging}
                                                    id={token.id}
                                                    popover={false}
                                                    selected={props.selected.includes(token.id)}
                                                    tokenLists={props.tokenLists}
                                                />
                                            </div>
                                        )}
                                    </Draggable>
                                );
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
        <div className={"player-token-list"}>
            {props.tokens.map((token) => {
                const data = token.metadata[itemMetadataKey] as GMGMetadata;
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
        </div>
    );
};
