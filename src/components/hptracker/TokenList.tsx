import React from "react";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import { Draggable } from "react-beautiful-dnd";
import { Token } from "./Token.tsx";

type TokenListProps = {
    tokens: Item[];
    selected: Array<string>;
    metadata: SceneMetadata;
};

export const DraggableTokenList = React.memo(function DraggableTokenList(props: TokenListProps) {
    const updateTokenIndex = (id: string, index: number) => {
        OBR.scene.items.updateItems([id], (items) => {
            items.forEach((item) => {
                const data = item.metadata[characterMetadata] as HpTrackerMetadata;

                data.index = index;

                item.metadata[characterMetadata] = { ...data };
            });
        });
    };

    return (
        <>
            {props.tokens.length > 0 ? (
                props.tokens?.map((token, index) => {
                    const data = token.metadata[characterMetadata] as HpTrackerMetadata;
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
                                            item={token}
                                            data={data}
                                            popover={false}
                                            selected={props.selected.includes(token.id)}
                                            metadata={props.metadata}
                                        />
                                    </div>
                                )}
                            </Draggable>
                        );
                    }

                    return null;
                })
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
                const data = token.metadata[characterMetadata] as HpTrackerMetadata;
                if (data) {
                    return (
                        <Token
                            key={token.id}
                            item={token}
                            data={data}
                            popover={false}
                            selected={props.selected.includes(token.id)}
                            metadata={props.metadata}
                        />
                    );
                }
            })}
        </>
    );
};
