import { Droppable } from "react-beautiful-dnd";
import { DraggableTokenList } from "./TokenList.tsx";
import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import { characterMetadata, sceneMetadata } from "../../helper/variables.ts";
import { updateHp } from "../../helper/hpHelpers.ts";
import { updateAc } from "../../helper/acHelper.ts";

type DropGroupProps = {
    title: string;
    list: Array<Item>;
    selected: Array<string>;
    metadata: SceneMetadata;
    tokenLists: Map<string, Array<Item>>;
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
        await OBR.scene.setMetadata(ownMetadata);
    };

    const getHpBar = () => {
        const hpBars = props.list.map((token) => {
            const metadata = token.metadata[characterMetadata] as HpTrackerMetadata;
            return metadata.hpBar;
        });
        return hpBars.some((bar) => bar);
    };

    const toggleHpBar = async () => {
        const current = getHpBar();
        await OBR.scene.items.updateItems(props.list, (items) => {
            items.forEach((item) => {
                (item.metadata[characterMetadata] as HpTrackerMetadata).hpBar = !current;
            });
        });
        for (const item of props.list) {
            const data = item.metadata[characterMetadata] as HpTrackerMetadata;
            await updateHp(item, { ...data, hpBar: !current });
        }
    };

    const getHpOnMap = () => {
        const hpMap = props.list.map((token) => {
            const metadata = token.metadata[characterMetadata] as HpTrackerMetadata;
            return metadata.hpOnMap;
        });
        return hpMap.some((map) => map);
    };

    const toggleHpOnMap = async () => {
        const current = getHpOnMap();
        await OBR.scene.items.updateItems(props.list, (items) => {
            items.forEach((item) => {
                (item.metadata[characterMetadata] as HpTrackerMetadata).hpOnMap = !current;
            });
        });
        for (const item of props.list) {
            const data = item.metadata[characterMetadata] as HpTrackerMetadata;
            await updateHp(item, { ...data, hpOnMap: !current });
        }
    };

    const getAcOnMap = () => {
        const acMap = props.list.map((token) => {
            const metadata = token.metadata[characterMetadata] as HpTrackerMetadata;
            return metadata.acOnMap;
        });
        return acMap.some((map) => map);
    };

    const toggleAcOnMap = async () => {
        const current = getAcOnMap();
        await OBR.scene.items.updateItems(props.list, (items) => {
            items.forEach((item) => {
                (item.metadata[characterMetadata] as HpTrackerMetadata).acOnMap = !current;
            });
        });
        for (const item of props.list) {
            const data = item.metadata[characterMetadata] as HpTrackerMetadata;
            await updateAc(item, { ...data, acOnMap: !current });
        }
    };
    const getCanPlayersSee = () => {
        const canSee = props.list.map((token) => {
            const metadata = token.metadata[characterMetadata] as HpTrackerMetadata;
            return metadata.canPlayersSee;
        });
        return canSee.some((see) => see);
    };

    const toggleCanPlayerSee = async () => {
        const current = getCanPlayersSee();
        await OBR.scene.items.updateItems(props.list, (items) => {
            items.forEach((item) => {
                (item.metadata[characterMetadata] as HpTrackerMetadata).canPlayersSee = !current;
            });
        });
        for (const item of props.list) {
            const data = item.metadata[characterMetadata] as HpTrackerMetadata;
            await updateHp(item, { ...data, canPlayersSee: !current });
            await updateAc(item, { ...data, canPlayersSee: !current });
        }
    };

    const setInitiative = async () => {
        await OBR.scene.items.updateItems(props.list, (items) => {
            items.forEach((item) => {
                const value =
                    Math.floor(Math.random() * (props.metadata.initiativeDice ?? 20)) +
                    1 +
                    (item.metadata[characterMetadata] as HpTrackerMetadata).stats.initiativeBonus;
                (item.metadata[characterMetadata] as HpTrackerMetadata).initiative = value;
            });
        });
    };

    return (
        <div
            className={`group-wrapper ${
                props.metadata.openGroups && props.metadata.openGroups?.indexOf(props.title) >= 0 ? "" : "hidden"
            }`}
        >
            <div className={"group-title"}>
                <div className={"group-name"}>
                    <span>{props.title}</span>
                </div>
                <div className={"settings"}>
                    <button
                        title={"Toggle HP Bar visibility for GM and Players"}
                        className={`toggle-button hp ${getHpBar() ? "on" : "off"}`}
                        onClick={() => {
                            toggleHpBar();
                        }}
                    />
                    <button
                        title={"Toggle HP displayed on Map"}
                        className={`toggle-button map ${getHpOnMap() ? "on" : "off"}`}
                        onClick={() => {
                            toggleHpOnMap();
                        }}
                    />
                    <button
                        title={"Toggle AC displayed on Map"}
                        className={`toggle-button ac ${getAcOnMap() ? "on" : "off"}`}
                        onClick={async () => {
                            toggleAcOnMap();
                        }}
                    />
                    <button
                        title={"Toggle HP/AC visibility for players"}
                        className={`toggle-button players ${getCanPlayersSee() ? "on" : "off"}`}
                        onClick={() => {
                            toggleCanPlayerSee();
                        }}
                    />
                </div>
                <button
                    title={"Roll Initiative (including initiative modifier from statblock)"}
                    className={`toggle-button initiative-button`}
                    onClick={() => {
                        setInitiative();
                    }}
                />
                <button
                    className={"hide-group"}
                    onClick={async () => {
                        await setOpenGroupSetting(props.title);
                    }}
                ></button>
            </div>
            <div className={"drop-list-wrapper"}>
                <div className={"drop-list"}>
                    <Droppable droppableId={props.title}>
                        {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                <DraggableTokenList
                                    tokens={props.list}
                                    selected={props.selected}
                                    metadata={props.metadata}
                                    tokenLists={props.tokenLists}
                                />
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
            </div>
        </div>
    );
};
