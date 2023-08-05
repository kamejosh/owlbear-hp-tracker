import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import React, { MouseEvent, useEffect, useState } from "react";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { characterMetadata, sceneMetadata } from "../../helper/variables.ts";
import { useCharSheet } from "../../context/CharacterContext.ts";
import { useGetOpen5eMonster } from "../../open5e/useOpen5e.ts";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";

type TokenProps = {
    id: string;
    data: HpTrackerMetadata;
};

export const Token = (props: TokenProps) => {
    const playerContext = usePlayerContext();
    const [data, setData] = useState<HpTrackerMetadata>(props.data);
    const [editName, setEditName] = useState<boolean>(false);
    const [allowNegativNumbers, setAllowNegativeNumbers] = useState<boolean | undefined>(undefined);
    const { isReady } = SceneReadyContext();
    const { setId } = useCharSheet();

    const sheetQuery = useGetOpen5eMonster(data.sheet ?? "");

    const sheetData = sheetQuery.isSuccess ? sheetQuery.data : null;

    useEffect(() => {
        setData(props.data);
    }, [props.data]);

    useEffect(() => {
        const initMetadataValues = async () => {
            const handleMetadata = (metadata: Metadata) => {
                if (sceneMetadata in metadata) {
                    const sceneData = metadata[sceneMetadata] as SceneMetadata;
                    setAllowNegativeNumbers(sceneData.allowNegativeNumbers ?? false);
                }
            };
            const metadata = (await OBR.scene.getMetadata()) as Metadata;
            handleMetadata(metadata);

            OBR.scene.onMetadataChange((metadata) => {
                handleMetadata(metadata);
            });
        };
        if (isReady) {
            initMetadataValues();
        }
    }, [isReady]);

    useEffect(() => {
        // could be undefined so we check for boolean
        if (allowNegativNumbers === false) {
            if (data.hp < 0) {
                handleValueChange(0, "hp");
            }
            if (data.armorClass < 0) {
                handleValueChange(0, "armorClass");
            }
        }
    }, [allowNegativNumbers]);

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
                    currentData.armorClass = allowNegativNumbers ? Number(value) : Math.max(Number(value), 0);
                    setData({ ...data, armorClass: currentData.armorClass });
                } else if (key === "maxHP") {
                    currentData.maxHp = Math.max(Number(value), 0);
                    if (updateHp && currentData.maxHp < currentData.hp) {
                        currentData.hp = currentData.maxHp;
                        setData({ ...data, hp: currentData.hp });
                    }
                    setData({ ...data, maxHp: currentData.maxHp });
                } else if (key === "hp") {
                    currentData.hp = allowNegativNumbers ? Number(value) : Math.max(Number(value), 0);
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
                <button
                    title={"Change entry name"}
                    className={`edit ${editName ? "on" : "off"}`}
                    onClick={() => setEditName(!editName)}
                ></button>
            </div>
            {playerContext.role === "GM" ? (
                <div className={"settings"}>
                    <button
                        title={"Toggle HP Bar visibility for GM and Players"}
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
                        title={"Toggle AC displayed on Map"}
                        className={`toggle-button ac ${data.acOnMap ? "on" : "off"}`}
                        onClick={() => {
                            handleValueChange(!data.acOnMap, "acOnMap");
                        }}
                    />
                    <button
                        title={"Toggle HP/AC visibility for players"}
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
                        let factor = 1;
                        if (allowNegativNumbers) {
                            factor = e.target.value.startsWith("-") ? -1 : 1;
                        }
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(Math.min(Number(value * factor), data.maxHp), "hp");
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
                        let factor = 1;
                        if (allowNegativNumbers) {
                            factor = e.target.value.startsWith("-") ? -1 : 1;
                        }
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(value * factor, "armorClass");
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
                    title={"Roll Initiative (including DEX modifier from statblock)"}
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
            <div className={"info-button-wrapper"}>
                <button
                    title={"Show Statblock"}
                    className={"toggle-button info-button"}
                    onClick={() => setId(props.id)}
                />
            </div>
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
