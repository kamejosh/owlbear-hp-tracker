import { HpTrackerMetadata } from "../../helper/types.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import React, { MouseEvent, useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../helper/variables.ts";
import { useCharSheet } from "../../context/CharacterContext.ts";
import { useGetOpen5eMonster } from "../../open5e/useOpen5e.ts";

type TokenProps = {
    id: string;
    data: HpTrackerMetadata;
};

export const Token = (props: TokenProps) => {
    const [data, setData] = useState<HpTrackerMetadata>(props.data);
    const playerContext = usePlayerContext();
    const [editName, setEditName] = useState<boolean>(false);
    const { setId } = useCharSheet();

    const sheetQuery = useGetOpen5eMonster(data.sheet ?? "");

    const sheetData = sheetQuery.isSuccess ? sheetQuery.data : null;

    useEffect(() => {
        setData(props.data);
    }, [props.data]);

    const handleValueChange = (value: string | number | boolean, key: string, updateHp: boolean = false) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                if (key === "name") {
                    currentData.name = String(value);
                    setData({ ...data, name: currentData.name });
                } else if (key === "players") {
                    currentData.canPlayersSee = !!value;
                    setData({ ...data, canPlayersSee: currentData.canPlayersSee });
                } else if (key === "acOnMap") {
                    currentData.acOnMap = !!value;
                    setData({ ...data, acOnMap: currentData.acOnMap });
                } else if (key === "hpOnMap") {
                    currentData.hpOnMap = !!value;
                    setData({ ...data, hpOnMap: currentData.hpOnMap });
                } else if (key === "hpBar") {
                    currentData.hpBar = !!value;
                    setData({ ...data, hpBar: currentData.hpBar });
                } else if (key === "armorClass") {
                    currentData.armorClass = Math.max(Number(value), 0);
                    setData({ ...data, armorClass: currentData.armorClass });
                } else if (key === "maxHP") {
                    currentData.maxHp = Math.max(Number(value), 0);
                    if (updateHp && currentData.maxHp < currentData.hp) {
                        currentData.hp = currentData.maxHp;
                        setData({ ...data, hp: currentData.hp });
                    }
                    setData({ ...data, maxHp: currentData.maxHp });
                } else if (key === "hp") {
                    currentData.hp = Math.max(Number(value), 0);
                    setData({ ...data, hp: currentData.hp });
                } else if (key === "initiative") {
                    currentData.initiative = Number(value);
                    setData({ ...data, initiative: currentData.initiative });
                }
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleOnPlayerClick = (event: MouseEvent) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                if (event.type === "mousedown") {
                    item.rotation = 10;
                } else {
                    item.rotation = 0;
                }
            });
        });
    };

    const display = (): boolean => {
        return (
            props.data.hpTrackerActive &&
            (playerContext.role === "GM" || (playerContext.role === "PLAYER" && props.data.canPlayersSee))
        );
    };

    const getBgColor = () => {
        if (props.data.hp === 0 && props.data.maxHp === 0) {
            return "#242424";
        }

        const percent = props.data.hp / props.data.maxHp;

        const g = 255 * percent;
        const r = 255 - 255 * percent;
        return "rgb(" + r + "," + g + ",0,0.2)";
    };

    return display() ? (
        <div
            className={`player-wrapper ${playerContext.role === "PLAYER" ? "player" : ""}`}
            style={{ background: `linear-gradient(to right, ${getBgColor()}, #242424 50%, #242424 )` }}
        >
            <div className={"player-name"}>
                {editName ? (
                    <input
                        className={"edit-name"}
                        type={"text"}
                        value={data.name}
                        onChange={(e) => {
                            handleValueChange(e.target.value, "name");
                        }}
                    />
                ) : (
                    <div
                        className={"name"}
                        onMouseDown={handleOnPlayerClick}
                        onMouseUp={handleOnPlayerClick}
                        onMouseLeave={handleOnPlayerClick}
                    >
                        {props.data.name}
                    </div>
                )}
                <button className={`edit ${editName ? "on" : "off"}`} onClick={() => setEditName(!editName)}></button>
            </div>
            {playerContext.role === "GM" ? (
                <div className={"settings"}>
                    <button
                        title={"Toggle HP Display Mode for Character"}
                        className={`toggle-button hp ${data.hpBar ? "on" : "off"}`}
                        onClick={() => {
                            handleValueChange(!data.hpBar, "hpBar");
                        }}
                    />
                    <button
                        title={"Toggle HP displayed on Map"}
                        className={`toggle-button map ${data.hpOnMap ? "on" : "off"}`}
                        onClick={() => {
                            handleValueChange(!data.hpOnMap, "hpOnMap");
                        }}
                    />
                    <button
                        title={"Toggle AC visible on Map"}
                        className={`toggle-button ac ${data.acOnMap ? "on" : "off"}`}
                        onClick={() => {
                            handleValueChange(!data.acOnMap, "acOnMap");
                        }}
                    />
                    <button
                        title={"Toggle HP visible for players"}
                        className={`toggle-button players ${data.canPlayersSee ? "on" : "off"}`}
                        onClick={() => {
                            handleValueChange(!data.canPlayersSee, "players");
                        }}
                    />{" "}
                </div>
            ) : null}
            <div className={"current-hp"}>
                <input
                    type={"text"}
                    size={3}
                    value={data.hp}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(Math.min(Number(value), data.maxHp), "hp");
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            handleValueChange(Math.min(data.hp + 1, data.maxHp), "hp");
                        } else if (e.key === "ArrowDown") {
                            handleValueChange(Math.min(data.hp - 1, data.maxHp), "hp");
                        }
                    }}
                />
                <span>/</span>
                <input
                    type={"text"}
                    size={3}
                    value={data.maxHp}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(Number(value), "maxHP", false);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            handleValueChange(data.maxHp + 1, "maxHP", true);
                        } else if (e.key === "ArrowDown") {
                            handleValueChange(data.maxHp - 1, "maxHP", true);
                        }
                    }}
                    onBlur={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(Number(value), "maxHP", true);
                    }}
                />
            </div>
            <div className={"armor-class"}>
                <input
                    type={"text"}
                    size={1}
                    value={data.armorClass}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(value, "armorClass");
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            handleValueChange(data.armorClass + 1, "armorClass");
                        } else if (e.key === "ArrowDown") {
                            handleValueChange(data.armorClass - 1, "armorClass");
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
                        handleValueChange(value, "initiative");
                    }}
                    className={"initiative"}
                />
                <button
                    title={"Toggle HP displayed on Map"}
                    className={`toggle-button initiative-button`}
                    onClick={() => {
                        let dexBonus = 0;
                        if (sheetData) {
                            dexBonus = Math.floor((sheetData.dexterity - 10) / 2);
                        }
                        handleValueChange(Math.floor(Math.random() * 21) + dexBonus, "initiative");
                    }}
                />
            </div>
            <button className={"toggle-button info-button"} onClick={() => setId(props.id)} />
        </div>
    ) : props.data.hpBar ? (
        <div
            className={"player-wrapper player"}
            style={{ background: `linear-gradient(to right, ${getBgColor()}, #242424 50%, #242424 )` }}
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
