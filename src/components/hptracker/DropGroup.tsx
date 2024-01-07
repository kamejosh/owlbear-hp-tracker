import { Droppable } from "react-beautiful-dnd";
import { DraggableTokenList } from "./TokenList.tsx";
import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { SceneMetadata } from "../../helper/types.ts";
import { sceneMetadata } from "../../helper/variables.ts";

type DropGroupProps = {
    title: string;
    list: Array<Item>;
    selected: Array<string>;
    metadata: SceneMetadata;
};

export const DropGroup = (props: DropGroupProps) => {
    const setOpenGroupSetting = async (name: string) => {
        const metadata: Metadata = await OBR.scene.getMetadata();
        const hpTrackerSceneMetadata = metadata[sceneMetadata] as SceneMetadata;
        if (hpTrackerSceneMetadata.openGroups && hpTrackerSceneMetadata.openGroups.indexOf(name) >= 0) {
            hpTrackerSceneMetadata.openGroups.splice(hpTrackerSceneMetadata.openGroups.indexOf(name), 1);
        } else {
            hpTrackerSceneMetadata.openGroups?.push(name);
        }
        const ownMetadata: Metadata = {};
        ownMetadata[sceneMetadata] = hpTrackerSceneMetadata;
        console.log(hpTrackerSceneMetadata);
        await OBR.scene.setMetadata(ownMetadata);
    };

    return (
        <div
            className={`group-wrapper ${
                props.metadata.openGroups && props.metadata.openGroups?.indexOf(props.title) >= 0 ? "" : "hidden"
            }`}
        >
            <div className={"group-title"}>
                {props.title}{" "}
                <button
                    className={"hide-group"}
                    onClick={async () => {
                        await setOpenGroupSetting(props.title);
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
