import React, { useEffect } from "react";
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd";
import { useLocalStorage } from "../../../helper/hooks.ts";
import { ID, sceneMetadata } from "../../../helper/variables.ts";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { SceneMetadata } from "../../../helper/types.ts";
import { SceneReadyContext } from "../../../context/SceneReadyContext.ts";

type GroupProps = {
    sceneId: string;
};

type GroupListProps = {
    groups: Array<string>;
    setGroups: (groups: Array<string>) => void;
};

const updateGroups = (value: string, groups: Array<string>) => {
    if (value !== "") {
        const newGroups = Array.from(groups);
        newGroups.push(value);
        const filteredGroups = newGroups.filter((value, index, array) => {
            return index === array.indexOf(value) && value !== "";
        });
        if (!filteredGroups.includes("Default")) {
            filteredGroups.splice(0, 0, "Default");
        }
        return filteredGroups;
    } else {
        if (!groups.includes("Default")) {
            groups.splice(0, 0, "Default");
        }
        return groups;
    }
};

const DraggableGroupList = React.memo(function DraggableGroupList(props: GroupListProps) {
    return (
        <div className={"group-list"}>
            {props.groups.map((group, index) => {
                return (
                    <Draggable key={group} draggableId={group} index={index}>
                        {(provided) => (
                            <div
                                className={"group"}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                            >
                                {group}{" "}
                                {group !== "Default" ? (
                                    <button
                                        className={"remove"}
                                        onClick={() => {
                                            const groups = Array.from(props.groups);
                                            groups.splice(groups.indexOf(group), 1);
                                            if (!groups.includes("Default")) {
                                                groups.splice(0, 0, "Default");
                                            }
                                            console.log(groups);
                                        }}
                                    >
                                        X
                                    </button>
                                ) : null}
                            </div>
                        )}
                    </Draggable>
                );
            })}
        </div>
    );
});
export const Groups = (props: GroupProps) => {
    const [groups, setGroups] = useLocalStorage<Array<string>>(`${ID}.${props.sceneId}.groups`, ["Default"]);
    const { isReady } = SceneReadyContext();

    useEffect(() => {
        const setSceneMetadata = async () => {
            const metadata: Metadata = await OBR.scene.getMetadata();
            if (
                groups.length > 0 &&
                (metadata[sceneMetadata] as SceneMetadata).groups?.toString() !== groups.toString()
            ) {
                (metadata[sceneMetadata] as SceneMetadata).groups = groups;
                await OBR.scene.setMetadata(metadata);
            }
        };
        if (isReady) {
            setSceneMetadata();
        }
    }, [groups]);

    useEffect(() => {
        const setInitialGroups = async () => {
            const metadata: Metadata = await OBR.scene.getMetadata();
            const data = metadata[sceneMetadata] as SceneMetadata;
            if (data.groups) {
                setGroups(data.groups);
            }
        };
        if (isReady) {
            setInitialGroups();
        }
    }, []);

    const reorder = (list: string[], startIndex: number, endIndex: number) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        const items = result.filter((item) => item !== undefined);

        setGroups(items);
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        reorder(groups ?? [], result.source.index, result.destination.index);
    };

    return (
        <>
            Groups:
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId={"groups"} direction="horizontal">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                            <DraggableGroupList groups={groups} setGroups={setGroups} />
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                Add Group:{" "}
                <input
                    className={"new-group"}
                    type={"text"}
                    onBlur={(e) => {
                        const value = e.currentTarget.value;
                        const newGroups = updateGroups(value, groups);
                        setGroups(newGroups);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const value = e.currentTarget.value;
                            const newGroups = updateGroups(value, groups);
                            setGroups(newGroups);
                        }
                    }}
                />
            </DragDropContext>
        </>
    );
};
