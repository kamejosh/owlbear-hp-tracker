import { HpTrackerMetadata } from "../../helper/types.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import { useEffect, useRef, useState } from "react";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../helper/variables.ts";
import { useCharSheet } from "../../context/CharacterContext.ts";
import { updateHp } from "../../helper/hpHelpers.ts";
import { evalString, getBgColor, getRoomDiceUser } from "../../helper/helpers.ts";
import { updateAc } from "../../helper/acHelper.ts";
import _ from "lodash";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useDiceRoller } from "../../context/DDDiceContext.tsx";
import { diceToRoll, getUserUuid, localRoll, rollWrapper } from "../../helper/diceHelper.ts";
import { useRollLogContext } from "../../context/RollLogContext.tsx";

type TokenProps = {
    item: Item;
    data: HpTrackerMetadata;
    popover: boolean;
    selected: boolean;
    tokenLists?: Map<string, Array<Item>>;
};

export const Token = (props: TokenProps) => {
    const playerContext = usePlayerContext();
    const [data, setData] = useState<HpTrackerMetadata>(props.data);
    const [editName, setEditName] = useState<boolean>(false);
    const room = useMetadataContext((state) => state.room);
    const setId = useCharSheet((state) => state.setId);
    const [rollerApi, initialized, theme] = useDiceRoller((state) => [state.rollerApi, state.initialized, state.theme]);
    const addRoll = useRollLogContext((state) => state.addRoll);
    const [initHover, setInitHover] = useState<boolean>(false);
    const hpRef = useRef<HTMLInputElement>(null);
    const maxHpRef = useRef<HTMLInputElement>(null);
    const tempHpRef = useRef<HTMLInputElement>(null);
    const initButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        setData(props.data);
    }, [props.data]);

    useEffect(() => {
        if (hpRef && hpRef.current) {
            hpRef.current.value = props.data.hp.toString();
        }
    }, [props.data.hp]);

    useEffect(() => {
        if (maxHpRef && maxHpRef.current) {
            maxHpRef.current.value = props.data.maxHp.toString();
        }
    }, [props.data.maxHp]);

    useEffect(() => {
        // could be undefined so we check for boolean
        if (room && room.allowNegativeNumbers === false) {
            if (data.hp < 0) {
                changeHp(0);
            }
            if (data.armorClass < 0) {
                changeArmorClass(0);
            }
        }
    }, [room?.allowNegativeNumbers]);

    const changeHp = (newHp: number) => {
        const newData = { ...data };
        if (newHp < data.hp && data.stats.tempHp && data.stats.tempHp > 0) {
            newData.stats.tempHp = Math.max(data.stats.tempHp - (data.hp - newHp), 0);
            if (tempHpRef && tempHpRef.current) {
                tempHpRef.current.value = newData.stats.tempHp.toString();
            }
        }
        newData.hp = room?.allowNegativeNumbers ? newHp : Math.max(newHp, 0);
        updateHp(props.item, newData);
        setData(newData);
        handleValueChange(newData);
        if (hpRef && hpRef.current) {
            hpRef.current.value = newData.hp.toString();
        }
    };

    const changeMaxHp = (newMax: number) => {
        const newData = { ...data };
        newData.maxHp = Math.max(newMax, 0);
        let maxHp = newData.maxHp;
        if (newData.stats.tempHp) {
            maxHp += newData.stats.tempHp;
        }
        if (maxHp < newData.hp) {
            newData.hp = maxHp;
        }
        updateHp(props.item, newData);
        setData(newData);
        handleValueChange(newData);
        if (maxHpRef && maxHpRef.current) {
            maxHpRef.current.value = newMax.toString();
        }
    };

    const changeArmorClass = (newAc: number) => {
        if (!room?.allowNegativeNumbers) {
            newAc = Math.max(newAc, 0);
        }
        const newData = { ...data, armorClass: newAc };
        updateAc(props.item, newData);
        setData(newData);
        handleValueChange(newData);
    };

    const changeTempHp = (newTempHp: number) => {
        // temporary hitpoints can't be negative
        newTempHp = Math.max(newTempHp, 0);
        const newData = { ...data, stats: { ...data.stats, tempHp: newTempHp } };
        if (newTempHp > 0) {
            if (!data.stats.tempHp) {
                newData.hp += newTempHp;
            } else {
                newData.hp += newTempHp - data.stats.tempHp;
            }
        }
        newData.hp = Math.min(newData.hp, newData.maxHp + newData.stats.tempHp);
        updateHp(props.item, newData);
        setData(newData);
        handleValueChange(newData);
        if (hpRef && hpRef.current) {
            hpRef.current.value = newData.hp.toString();
        }
        if (tempHpRef && tempHpRef.current) {
            tempHpRef.current.value = newData.stats.tempHp.toString();
        }
    };

    const handleValueChange = (newData: HpTrackerMetadata) => {
        OBR.scene.items.updateItems([props.item], (items) => {
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
            await OBR.player.select([props.item.id]);
        } else {
            if (currentSelection.includes(props.item.id)) {
                currentSelection.splice(currentSelection.indexOf(props.item.id), 1);
                await OBR.player.select(currentSelection);
            } else {
                if (e.shiftKey) {
                    const toSelect = getGroupSelectRange(currentSelection);
                    if (toSelect) {
                        const extendedSelection = currentSelection.concat(toSelect);
                        extendedSelection.push(props.item.id);
                        await OBR.player.select(extendedSelection);
                    }
                } else if (e.metaKey || e.ctrlKey) {
                    currentSelection.push(props.item.id);
                    await OBR.player.select(currentSelection);
                } else {
                    await OBR.player.select([props.item.id]);
                }
            }
        }
    };

    const handleOnPlayerDoubleClick = async () => {
        const bounds = await OBR.scene.items.getItemBounds([props.item.id]);
        await OBR.player.select([props.item.id]);
        await OBR.viewport.animateToBounds({
            ...bounds,
            min: { x: bounds.min.x - 1000, y: bounds.min.y - 1000 },
            max: { x: bounds.max.x + 1000, y: bounds.max.y + 1000 },
        });
    };

    const display = (): boolean => {
        return (
            props.data.hpTrackerActive &&
            (playerContext.role === "GM" ||
                (playerContext.role === "PLAYER" && props.data.canPlayersSee && props.item.visible) ||
                props.item.createdUserId === playerContext.id)
        );
    };

    const getNewHpValue = (input: string) => {
        let value: number;
        let factor = 1;
        if (room?.allowNegativeNumbers) {
            factor = input.startsWith("-") ? -1 : 1;
        }
        if (input.indexOf("+") > 0 || input.indexOf("-") > 0) {
            value = Number(evalString(input));
        } else {
            value = Number(input.replace(/[^0-9]/g, ""));
        }
        let hp: number;
        if (data.maxHp > 0) {
            hp = Math.min(Number(value * factor), data.stats.tempHp ? data.maxHp + data.stats.tempHp : data.maxHp);
        } else {
            hp = Number(value * factor);
            const newData = { ...data, hp: hp, maxHp: Math.max(value, 0) };
            updateHp(props.item, newData);
            setData(newData);
            handleValueChange(newData);
            if (maxHpRef && maxHpRef.current) {
                maxHpRef.current.value = newData.maxHp.toString();
            }
            return null;
        }
        return room?.allowNegativeNumbers ? hp : Math.max(hp, 0);
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
                                setData(newData);
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
                            {props.data.name}
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
                            setData(newData);
                            handleValueChange(newData);
                            updateHp(props.item, newData);
                        }}
                    />
                    <button
                        title={"Toggle HP displayed on Map"}
                        className={`toggle-button map ${data.hpOnMap ? "on" : "off"}`}
                        onClick={() => {
                            const newData = { ...data, hpOnMap: !data.hpOnMap };
                            setData(newData);
                            handleValueChange(newData);
                            updateHp(props.item, newData);
                        }}
                    />
                    <button
                        title={"Toggle AC displayed on Map"}
                        className={`toggle-button ac ${data.acOnMap ? "on" : "off"}`}
                        onClick={async () => {
                            const newData = { ...data, acOnMap: !data.acOnMap };
                            setData(newData);
                            handleValueChange(newData);
                            updateAc(props.item, newData);
                        }}
                    />
                    <button
                        title={"Toggle HP/AC visibility for players"}
                        className={`toggle-button players ${data.canPlayersSee ? "on" : "off"}`}
                        onClick={() => {
                            const newData = { ...data, canPlayersSee: !data.canPlayersSee };
                            setData(newData);
                            handleValueChange(newData);
                            updateHp(props.item, newData);
                            updateAc(props.item, newData);
                        }}
                    />{" "}
                </div>
            ) : null}
            <div className={"current-hp"}>
                <input
                    ref={hpRef}
                    type={"text"}
                    size={3}
                    defaultValue={data.hp}
                    onBlur={(e) => {
                        const input = e.target.value;
                        const hp = getNewHpValue(input);
                        if (hp !== null) {
                            e.target.value = hp.toString();
                            changeHp(hp);
                        }
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            const hp = Math.min(
                                data.hp + 1,
                                data.stats.tempHp ? data.maxHp + data.stats.tempHp : data.maxHp
                            );
                            changeHp(hp);
                            e.currentTarget.value = hp.toString();
                        } else if (e.key === "ArrowDown") {
                            const hp = Math.min(
                                data.hp - 1,
                                data.stats.tempHp ? data.maxHp + data.stats.tempHp : data.maxHp
                            );
                            changeHp(hp);
                            e.currentTarget.value = hp.toString();
                        } else if (e.key === "Enter") {
                            const input = e.currentTarget.value;
                            const hp = getNewHpValue(input);
                            if (hp !== null) {
                                e.currentTarget.value = hp.toString();
                                changeHp(hp);
                            }
                        }
                    }}
                />
                <span>/</span>
                <input
                    type={"text"}
                    size={3}
                    ref={maxHpRef}
                    defaultValue={data.maxHp}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            changeMaxHp(data.maxHp + 1);
                        } else if (e.key === "ArrowDown") {
                            changeMaxHp(data.maxHp - 1);
                        } else if (e.key === "Enter") {
                            const value = Number(e.currentTarget.value.replace(/[^0-9]/g, ""));
                            changeMaxHp(value);
                        }
                    }}
                    onBlur={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        changeMaxHp(value);
                    }}
                />
            </div>
            <div className={"temp-hp"}>
                <input
                    type={"text"}
                    size={1}
                    defaultValue={data.stats.tempHp}
                    ref={tempHpRef}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            changeTempHp((data.stats.tempHp || 0) + 1);
                        } else if (e.key === "ArrowDown") {
                            changeTempHp((data.stats.tempHp || 0) - 1);
                        } else if (e.key === "Enter") {
                            const value = Number(e.currentTarget.value.replace(/[^0-9]/g, ""));
                            changeTempHp(value);
                        }
                    }}
                    onBlur={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        changeTempHp(value);
                    }}
                />
            </div>
            <div className={"armor-class"}>
                <input
                    type={"text"}
                    size={1}
                    value={data.armorClass}
                    onChange={(e) => {
                        let factor = 1;
                        if (room?.allowNegativeNumbers) {
                            factor = e.target.value.startsWith("-") ? -1 : 1;
                        }
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        changeArmorClass(value * factor);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            changeArmorClass(data.armorClass + 1);
                        } else if (e.key === "ArrowDown") {
                            changeArmorClass(data.armorClass - 1);
                        }
                    }}
                />
            </div>
            <div className={"initiative-wrapper"}>
                <input
                    type={"text"}
                    size={1}
                    value={data.initiative}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        const newData = { ...data, initiative: value };
                        setData(newData);
                        handleValueChange(newData);
                    }}
                    className={"initiative"}
                />
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
                            setData(newData);
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
                            setData(newData);
                            handleValueChange(newData);
                        }}
                    >
                        SELF
                    </button>
                </div>
            </div>
            {props.popover ? null : (
                <div className={"info-button-wrapper"}>
                    <button
                        title={"Show Statblock"}
                        className={"toggle-button info-button"}
                        onClick={() => setId(props.item.id)}
                    />
                </div>
            )}
        </div>
    ) : props.data.hpBar && props.item.visible ? (
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
                    {props.data.name}
                </div>
            </div>
        </div>
    ) : (
        <></>
    );
};
