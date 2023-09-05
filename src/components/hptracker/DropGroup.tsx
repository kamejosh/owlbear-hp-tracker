import { Droppable } from "react-beautiful-dnd";
import { DraggableTokenList } from "./TokenList.tsx";
import React from "react";
import { Item } from "@owlbear-rodeo/sdk";
import { SceneMetadata } from "../../helper/types.ts";

type DropGroupProps = {
    title: string;
    list: Array<Item>;
    selected: Array<string>;
    metadata: SceneMetadata;
};

export const DropGroup = (props: DropGroupProps) => {
    return (
        <div className={"group-wrapper"}>
            <div className={"group-title"}>
                {props.title}{" "}
                <button
                    className={"hide-group"}
                    onClick={(event) => {
                        event.currentTarget.parentElement?.parentElement?.classList.toggle("hidden");
                    }}
                ></button>
            </div>
            <div className={"drop-list"}>
                <Droppable droppableId={props.title}>
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                            <DraggableTokenList
                                tokens={props.list}
                                selected={props.selected}
                                metadata={props.metadata}
                            />
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    );
};
