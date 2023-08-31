import { Droppable } from "react-beautiful-dnd";
import { DraggableTokenList } from "./TokenList.tsx";
import React from "react";
import { Item } from "@owlbear-rodeo/sdk";

type DropGroupProps = {
    title: string;
    list: Array<Item>;
    selected: Array<string>;
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
                            <DraggableTokenList tokens={props.list} selected={props.selected} />
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        </div>
    );
};
