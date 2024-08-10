import { HpTrackerMetadata } from "../../../helper/types.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useEffect, useRef, useState } from "react";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../../helper/variables.ts";
import { useCharSheet } from "../../../context/CharacterContext.ts";
import { updateHp } from "../../../helper/hpHelpers.ts";
import { getBgColor, getRoomDiceUser } from "../../../helper/helpers.ts";
import { updateAc } from "../../../helper/acHelper.ts";
import _ from "lodash";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { diceToRoll, getUserUuid, localRoll, rollWrapper } from "../../../helper/diceHelper.ts";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import { changeArmorClass, changeHp } from "../../../helper/tokenHelper.ts";
import { HP } from "./HP.tsx";
import { AC } from "./AC.tsx";

type TokenProps = {
    id: string;
    popover: boolean;
    selected: boolean;
    tokenLists?: Map<string, Array<Item>>;
};

export const Token = (props: TokenProps) => {
    const playerContext = usePlayerContext();
    const [editName, setEditName] = useState<boolean>(false);
    const room = useMetadataContext((state) => state.room);
    const setId = useCharSheet((state) => state.setId);
    const [rollerApi, initialized, theme] = useDiceRoller((state) => [state.rollerApi, state.initialized, state.theme]);
    const component = useComponentContext((state) => state.component);
    const addRoll = useRollLogContext((state) => state.addRoll);
    const [initHover, setInitHover] = useState<boolean>(false);
    const initButtonRef = useRef<HTMLButtonElement>(null);
    const token = useTokenListContext((state) => state.tokens?.get(props.id));
    const data = token?.data as HpTrackerMetadata;
    const item = token?.item as Image;

    useEffect(() => {
        // could be undefined so we check for boolean
        if (room && room.allowNegativeNumbers === false) {
            if (data.hp < 0) {
                changeHp(0, data, item, undefined, undefined, room);
            }
            if (data.armorClass < 0) {
                changeArmorClass(0, data, item, room);
            }
        }
    }, [room?.allowNegativeNumbers]);

    const handleValueChange = (newData: HpTrackerMetadata) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[itemMetadataKey] = { ...newData };
            });
        });
    };

    const getGroupSelectRange = (currentSelection: Array<string>): Array<string> | null => {
        const currentGroup = data.group;
        const index = data.index!;

        if (currentGroup) {
            const groupItems = props.tokenLists?.get(currentGroup);
            if (groupItems) {
                const selectedGroupItems = groupItems.filter((item) => currentSelection.includes(item.id));

                const sortedByDistance = selectedGroupItems.sort((a, b) => {
                    const aData = a.metadata[itemMetadataKey] as HpTrackerMetadata;
                    const bData = b.metadata[itemMetadataKey] as HpTrackerMetadata;
                    const aDelta = Math.abs(index - aData.index!);
                    const bDelta = Math.abs(index - bData.index!);
                    if (aDelta < bDelta) {
                        return -1;
                    } else if (bDelta < aDelta) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                if (sortedByDistance.length > 0) {
                    const closestDistance = sortedByDistance[0];
                    const cdData = closestDistance.metadata[itemMetadataKey] as HpTrackerMetadata;

                    let indices: Array<number> = [];
                    if (cdData.index! < index) {
                        indices = _.range(cdData.index!, index);
                    } else {
                        indices = _.range(index, cdData.index);
                    }
                    const toSelect = groupItems.map((item) => {
                        const itemData = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                        if (itemData.index) {
                            if (indices.includes(itemData.index)) {
                                return item.id;
                            }
                        }
                    });

                    return toSelect.filter((item): item is string => !!item);
                }
            }
        }

        return null;
    };

    const handleOnPlayerClick = async (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        const currentSelection = (await OBR.player.getSelection()) || [];
        if (currentSelection.length === 0) {
            await OBR.player.select([props.id]);
        } else {
            if (currentSelection.includes(props.id)) {
                currentSelection.splice(currentSelection.indexOf(props.id), 1);
                await OBR.player.select(currentSelection);
            } else {
                if (e.shiftKey) {
                    const toSelect = getGroupSelectRange(currentSelection);
                    if (toSelect) {
                        const extendedSelection = currentSelection.concat(toSelect);
                        extendedSelection.push(props.id);
                        await OBR.player.select(extendedSelection);
                    }
                } else if (e.metaKey || e.ctrlKey) {
                    currentSelection.push(props.id);
                    await OBR.player.select(currentSelection);
                } else {
                    await OBR.player.select([props.id]);
                }
            }
        }
    };

    const handleOnPlayerDoubleClick = async () => {
        const bounds = await OBR.scene.items.getItemBounds([props.id]);
        await OBR.player.select([props.id]);
        await OBR.viewport.animateToBounds({
            ...bounds,
            min: { x: bounds.min.x - 1000, y: bounds.min.y - 1000 },
            max: { x: bounds.max.x + 1000, y: bounds.max.y + 1000 },
        });
    };

    const display = (): boolean => {
        return (
            data.hpTrackerActive &&
            (playerContext.role === "GM" ||
                (playerContext.role === "PLAYER" && data.canPlayersSee && item.visible) ||
                item.createdUserId === playerContext.id)
        );
    };

    const rollInitiative = async (hidden: boolean) => {
        initButtonRef.current?.classList.add("rolling");
        let initiativeValue = 0;
        const dice = `1d${room?.initiativeDice ?? 20}+${data.stats.initiativeBonus}`;
        if (room && !room?.disableDiceRoller && theme && rollerApi) {
            const parsed = diceToRoll(dice, theme.id);
            if (parsed) {
                const rollData = await rollWrapper(rollerApi, parsed.dice, {
                    operator: parsed.operator,
                    external_id: data.name,
                    label: "Initiative: Roll",
                    whisper: hidden ? await getUserUuid(room, rollerApi) : undefined,
                });
                if (rollData) {
                    initiativeValue = Number(rollData.total_value);
                }
            }
        } else {
            const result = await localRoll(dice, "Initiative: Roll", addRoll, hidden, data.name);
            if (result) {
                initiativeValue = result.total;
            }
        }
        initButtonRef.current?.classList.remove("rolling");
        initButtonRef.current?.blur();
        return initiativeValue;
    };

    return display() ? (
        <div
            className={`player-wrapper ${playerContext.role === "PLAYER" ? "player" : ""} ${
                props.selected ? "selected" : ""
            }`}
            style={{ background: `linear-gradient(to right, ${getBgColor(data)}, #1C1B22 50%, #1C1B22 )` }}
        >
            {props.popover ? null : (
                <div className={"player-name"}>
                    {editName ? (
                        <input
                            className={"edit-name"}
                            type={"text"}
                            value={data.name}
                            onChange={(e) => {
                                const newData = { ...data, name: e.target.value };
                                handleValueChange(newData);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setEditName(false);
                                }
                            }}
                        />
                    ) : (
                        <div
                            className={"name"}
                            onClick={(e) => {
                                handleOnPlayerClick(e);
                            }}
                            onDoubleClick={(e) => {
                                e.preventDefault();
                                handleOnPlayerDoubleClick();
                            }}
                        >
                            {data.name}
                        </div>
                    )}
                    <button
                        title={"Change entry name"}
                        className={`edit ${editName ? "on" : "off"}`}
                        onClick={() => setEditName(!editName)}
                    ></button>
                </div>
            )}
            {playerContext.role === "GM" ? (
                <div className={"settings"}>
                    <button
                        title={"Toggle HP Bar visibility for GM and Players"}
                        className={`toggle-button hp ${data.hpBar ? "on" : "off"}`}
                        onClick={() => {
                            const newData = { ...data, hpBar: !data.hpBar };
                            handleValueChange(newData);
                            updateHp(item, newData);
                        }}
                    />
                    <button
                        title={"Toggle HP displayed on Map"}
                        className={`toggle-button map ${data.hpOnMap ? "on" : "off"}`}
                        onClick={() => {
                            const newData = { ...data, hpOnMap: !data.hpOnMap };
                            handleValueChange(newData);
                            updateHp(item, newData);
                        }}
                    />
                    <button
                        title={"Toggle AC displayed on Map"}
                        className={`toggle-button ac ${data.acOnMap ? "on" : "off"}`}
                        onClick={async () => {
                            const newData = { ...data, acOnMap: !data.acOnMap };
                            handleValueChange(newData);
                            updateAc(item, newData);
                        }}
                    />
                    <button
                        title={"Toggle HP/AC visibility for players"}
                        className={`toggle-button players ${data.canPlayersSee ? "on" : "off"}`}
                        onClick={() => {
                            const newData = { ...data, canPlayersSee: !data.canPlayersSee };
                            handleValueChange(newData);
                            updateHp(item, newData);
                            updateAc(item, newData);
                        }}
                    />{" "}
                </div>
            ) : null}
            <HP id={props.id} />
            <AC id={props.id} />
            <div className={"initiative-wrapper"}>
                <input
                    type={"text"}
                    size={1}
                    value={data.initiative}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        const newData = { ...data, initiative: value };
                        handleValueChange(newData);
                    }}
                    className={"initiative"}
                />
                {component !== "popover" ? (
                    <div
                        className={"init-wrapper"}
                        onMouseEnter={() => {
                            setInitHover(true);
                        }}
                        onMouseLeave={() => setInitHover(false)}
                    >
                        <button
                            title={"Roll Initiative (including initiative modifier from statblock)"}
                            className={`toggle-button initiative-button`}
                            disabled={
                                getRoomDiceUser(room, playerContext.id)?.diceRendering &&
                                !initialized &&
                                !room?.disableDiceRoller
                            }
                            onClick={async () => {
                                const value = await rollInitiative(false);
                                const newData = { ...data, initiative: value };
                                handleValueChange(newData);
                            }}
                        />
                        <button
                            className={`self ${initHover ? "visible" : "hidden"}`}
                            disabled={
                                getRoomDiceUser(room, playerContext.id)?.diceRendering &&
                                !initialized &&
                                !room?.disableDiceRoller
                            }
                            onClick={async () => {
                                const value = await rollInitiative(true);
                                const newData = { ...data, initiative: value };
                                handleValueChange(newData);
                            }}
                        >
                            HIDE
                        </button>
                    </div>
                ) : null}
            </div>
            {props.popover ? null : (
                <div className={"info-button-wrapper"}>
                    <button
                        title={"Show Statblock"}
                        className={"toggle-button info-button"}
                        onClick={() => setId(item.id)}
                    />
                </div>
            )}
        </div>
    ) : data.hpBar && item.visible ? (
        <div
            className={"player-wrapper player"}
            style={{ background: `linear-gradient(to right, ${getBgColor(data)}, #242424 50%, #242424 )` }}
        >
            <div className={"player-name"}>
                <div
                    className={"name"}
                    onMouseDown={handleOnPlayerClick}
                    onMouseUp={handleOnPlayerClick}
                    onMouseLeave={handleOnPlayerClick}
                >
                    {data.name}
                </div>
            </div>
        </div>
    ) : (
        <></>
    );
};
