import React from "react";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import { Draggable } from "react-beautiful-dnd";
import { Token } from "./Token.tsx";

export const DraggableTokenList = React.memo(function DraggableTokenList({ tokens }: { tokens: Item[] }) {
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
            {tokens.length > 0 ? (
                tokens?.map((token, index) => {
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
                                        <Token id={token.id} data={data} popover={false} />
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

export const PlayerTokenList = ({ tokens }: { tokens: Item[] }) => {
    return (
        <>
            {tokens.map((token) => {
                const data = token.metadata[characterMetadata] as HpTrackerMetadata;
                if (data) {
                    return <Token key={token.id} id={token.id} data={data} popover={false} />;
                }
            })}
        </>
    );
};
