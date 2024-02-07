import { Droppable } from "react-beautiful-dnd";
import { DraggableTokenList } from "./TokenList.tsx";
import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import { itemMetadataKey, metadataKey } from "../../helper/variables.ts";
import {
    getAcOnMap,
    getCanPlayersSee,
    getHpBar,
    getHpOnMap,
    toggleAcOnMap,
    toggleCanPlayerSee,
    toggleHpBar,
    toggleHpOnMap,
} from "../../helper/multiTokenHelper.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useDiceRoller } from "../../context/DDDiceContext.tsx";
import { IDiceRoll, IRoll, Operator } from "dddice-js";
import { diceToRoll } from "../../helper/diceHelper.ts";
import { dddiceRollToRollLog, getRoomDiceUser } from "../../helper/helpers.ts";
import { useComponentContext } from "../../context/ComponentContext.tsx";
import { useRollLogContext } from "../../context/RollLogContext.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";

type DropGroupProps = {
    title: string;
    list: Array<Item>;
    selected: Array<string>;
    tokenLists: Map<string, Array<Item>>;
};

export const DropGroup = (props: DropGroupProps) => {
    const { room, scene } = useMetadataContext();
    const { component } = useComponentContext();
    const { addRoll } = useRollLogContext();
    const { rollerApi, initialized, theme } = useDiceRoller();
    const playerContext = usePlayerContext();

    const setOpenGroupSetting = async (name: string) => {
        const metadata: Metadata = await OBR.scene.getMetadata();
        const hpTrackerSceneMetadata = metadata[metadataKey] as SceneMetadata;
        if (hpTrackerSceneMetadata.openGroups && hpTrackerSceneMetadata.openGroups.indexOf(name) >= 0) {
            hpTrackerSceneMetadata.openGroups.splice(hpTrackerSceneMetadata.openGroups.indexOf(name), 1);
        } else {
            hpTrackerSceneMetadata.openGroups?.push(name);
        }
        const ownMetadata: Metadata = {};
        ownMetadata[metadataKey] = hpTrackerSceneMetadata;
        await OBR.scene.setMetadata(ownMetadata);
    };

    const roll = async (button: HTMLButtonElement, dice: string) => {
        button.classList.add("rolling");
        if (theme) {
            let parsed: { dice: IDiceRoll[]; operator: Operator | undefined } | undefined = diceToRoll(dice, theme.id);
            if (parsed) {
                const roll = await rollerApi?.roll.create(parsed.dice, {
                    operator: parsed.operator,
                    external_id: component,
                    label: "Initiative: Roll",
                });
                if (roll && roll.data) {
                    const data = roll.data;
                    addRoll(await dddiceRollToRollLog(data, { owlbear_user_id: OBR.player.id || undefined }));
                    button.classList.remove("rolling");
                    return data;
                }
            }
        }
        button.classList.remove("rolling");
        button.blur();
    };

    const setInitiative = async (button: HTMLButtonElement) => {
        let rollData: IRoll | undefined;
        const id = OBR.player.id;
        if (getRoomDiceUser(room, id)?.diceRendering) {
            rollData = await roll(button, `${props.list.length}d${room?.initiativeDice ?? 20}`);
        }
        await OBR.scene.items.updateItems(props.list, (items) => {
            items.forEach((item, index) => {
                let value = 0;
                let bonus = (item.metadata[itemMetadataKey] as HpTrackerMetadata).stats.initiativeBonus;
                if (rollData && rollData.values.length >= items.length) {
                    value = rollData.values[index].value + bonus;
                } else {
                    value = Math.floor(Math.random() * (room?.initiativeDice ?? 20)) + 1 + bonus;
                }
                (item.metadata[itemMetadataKey] as HpTrackerMetadata).initiative = value;
            });
        });
    };

    return (
        <div
            className={`group-wrapper ${
                scene?.openGroups && scene?.openGroups?.indexOf(props.title) >= 0 ? "" : "hidden"
            }`}
        >
            <div className={"group-title"}>
                <div className={"group-name"}>
                    <span>{props.title}</span>
                </div>
                <div className={"settings"}>
                    <button
                        title={"Toggle HP Bar visibility for GM and Players"}
                        className={`toggle-button hp ${getHpBar(props.list) ? "on" : "off"}`}
                        onClick={() => {
                            toggleHpBar(props.list);
                        }}
                    />
                    <button
                        title={"Toggle HP displayed on Map"}
                        className={`toggle-button map ${getHpOnMap(props.list) ? "on" : "off"}`}
                        onClick={() => {
                            toggleHpOnMap(props.list);
                        }}
                    />
                    <button
                        title={"Toggle AC displayed on Map"}
                        className={`toggle-button ac ${getAcOnMap(props.list) ? "on" : "off"}`}
                        onClick={async () => {
                            toggleAcOnMap(props.list);
                        }}
                    />
                    <button
                        title={"Toggle HP/AC visibility for players"}
                        className={`toggle-button players ${getCanPlayersSee(props.list) ? "on" : "off"}`}
                        onClick={() => {
                            toggleCanPlayerSee(props.list);
                        }}
                    />
                </div>
                <button
                    title={"Roll Initiative (including initiative modifier from statblock)"}
                    className={`toggle-button initiative-button`}
                    disabled={getRoomDiceUser(room, playerContext.id)?.diceRendering && !initialized}
                    onClick={async (e) => {
                        await setInitiative(e.currentTarget);
                    }}
                />
                <button
                    className={"hide-group"}
                    onClick={async () => {
                        await setOpenGroupSetting(props.title);
                    }}
                ></button>
            </div>
            <Droppable droppableId={props.title}>
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        <DraggableTokenList
                            tokens={props.list}
                            selected={props.selected}
                            tokenLists={props.tokenLists}
                        />
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
};
