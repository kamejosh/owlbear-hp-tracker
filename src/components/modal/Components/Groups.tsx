import React from "react";

import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateSceneMetadata } from "../../../helper/helpers.ts";
import { DragDropContext, Draggable, Droppable, DropResult } from "react-beautiful-dnd";

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

const DraggableGroupList = React.memo(function DraggableGroupList() {
    const scene = useMetadataContext((state) => state.scene);
    return (
        <div className={"group-list"}>
            {scene && scene.groups
                ? scene.groups.map((group, index) => {
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
                                                  const groups = Array.from(scene.groups || []);
                                                  groups.splice(groups.indexOf(group), 1);
                                                  if (!groups.includes("Default")) {
                                                      groups.splice(0, 0, "Default");
                                                  }

                                                  updateSceneMetadata(scene, { groups: groups });
                                              }}
                                          >
                                              X
                                          </button>
                                      ) : null}
                                  </div>
                              )}
                          </Draggable>
                      );
                  })
                : null}
        </div>
    );
});
export const Groups = () => {
    const scene = useMetadataContext((state) => state.scene);

    const reorder = (list: string[], startIndex: number, endIndex: number) => {
        const result = Array.from(list);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        const items = result.filter((item) => item !== undefined);

        updateSceneMetadata(scene, { groups: items });
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) {
            return;
        }

        if (result.destination.index === result.source.index) {
            return;
        }

        reorder(scene?.groups ?? [], result.source.index, result.destination.index);
    };

    return (
        <>
            Groups:
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId={"groups"} direction="horizontal">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                            <DraggableGroupList />
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
                        const newGroups = updateGroups(value, scene?.groups || []);
                        updateSceneMetadata(scene, { groups: newGroups });
                        e.currentTarget.value = "";
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const value = e.currentTarget.value;
                            const newGroups = updateGroups(value, scene?.groups || []);
                            updateSceneMetadata(scene, { groups: newGroups });
                            e.currentTarget.value = "";
                        }
                    }}
                />
            </DragDropContext>
        </>
    );
};
