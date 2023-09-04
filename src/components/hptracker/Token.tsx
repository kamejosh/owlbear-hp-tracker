import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import React, { MouseEvent, useEffect, useRef, useState } from "react";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { characterMetadata, sceneMetadata } from "../../helper/variables.ts";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { updateText } from "../../helper/textHelpers.ts";
import { updateHpBar } from "../../helper/shapeHelpers.ts";
import { evalString } from "../../helper/helpers.ts";

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
    const shieldsRef = useRef<HTMLInputElement>(null);
    const hp2Ref = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setData(props.data);
    }, [props.data]);

    useEffect(() => {
        if (shieldsRef && shieldsRef.current) {
            shieldsRef.current.value = props.data.shields.toString();
        }
    }, [props.data.shields]);

    useEffect(() => {
        if (hp2Ref && hp2Ref.current) {
            hp2Ref.current.value = props.data.hp2.toString();
        }
    }, [props.data.hp2]);

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
            updateHpBar(data.hpBar, props.id, data);
            updateText(data.hpOnMap || data.acOnMap, data.canPlayersSee, props.id, data);
        }
    }, [isReady]);

    useEffect(() => {
        // could be undefined so we check for boolean
        if (allowNegativNumbers === false) {
            if (data.shields < 0) {
                handleValueChange(0, "shields");
            }
            if (data.hp2 < 0) {
                handleValueChange(0, "hp2");
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
                    updateText(data.hpOnMap || data.acOnMap, !!value, props.id, { ...data, canPlayersSee: !!value });
                    setData({ ...data, canPlayersSee: currentData.canPlayersSee });
                } else if (key === "acOnMap") {
                    currentData.acOnMap = !!value;
                    updateText(data.hpOnMap || !!value, data.canPlayersSee, props.id, { ...data, acOnMap: !!value });
                    setData({ ...data, acOnMap: currentData.acOnMap });
                } else if (key === "hpOnMap") {
                    currentData.hpOnMap = !!value;
                    updateText(!!value || data.acOnMap, data.canPlayersSee, props.id, { ...data, hpOnMap: !!value });
                    setData({ ...data, hpOnMap: currentData.hpOnMap });
                } else if (key === "hpBar") {
                    currentData.hpBar = !!value;
                    updateHpBar(!!value, props.id, data);
                    setData({ ...data, hpBar: currentData.hpBar });
                } else if (key === "maxShields") {
                    currentData.maxShields = Math.max(Number(value), 0);
                    if (updateHp && currentData.maxShields < currentData.shields) {
                        currentData.shields = currentData.maxShields;
                        setData({ ...data, shields: currentData.shields });
                    }
                    updateHpBar(data.hpBar, props.id, {
                        ...data,
                        shields: currentData.shields,
                        maxShields: currentData.maxShields,
                    });
                    updateText(data.hpOnMap || data.acOnMap, data.canPlayersSee, props.id, {
                        ...data,
                        maxShields: currentData.maxShields,
                        shields: currentData.shields,
                    });
                    setData({ ...data, maxShields: currentData.maxShields });
                } else if (key === "shields") {
                    currentData.shields = allowNegativNumbers ? Number(value) : Math.max(Number(value), 0);
                    updateHpBar(data.hpBar, props.id, { ...data, shields: currentData.shields });
                    updateText(data.hpOnMap || data.acOnMap, data.canPlayersSee, props.id, {
                        ...data,
                        shields: currentData.shields,
                    });
                    setData({ ...data, shields: currentData.shields });
                } else if (key === "maxHP2") {
                    currentData.maxHp2 = Math.max(Number(value), 0);
                    if (updateHp && currentData.maxHp2 < currentData.hp2) {
                        currentData.hp2 = currentData.maxHp2;
                        setData({ ...data, hp2: currentData.hp2 });
                    }
                    updateHpBar(data.hpBar, props.id, { ...data, hp2: currentData.hp2, maxHp2: currentData.maxHp2 });
                    updateText(data.hpOnMap || data.acOnMap, data.canPlayersSee, props.id, {
                        ...data,
                        maxHp2: currentData.maxHp2,
                        hp2: currentData.hp2,
                    });
                    setData({ ...data, maxHp2: currentData.maxHp2 });
                } else if (key === "hp2") {
                    currentData.hp2 = allowNegativNumbers ? Number(value) : Math.max(Number(value), 0);
                    updateHpBar(data.hpBar, props.id, { ...data, hp2: currentData.hp2 });
                    updateText(data.hpOnMap || data.acOnMap, data.canPlayersSee, props.id, {
                        ...data,
                        hp2: currentData.hp2,
                    });
                    setData({ ...data, hp2: currentData.hp2 });
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
        if (props.data.shields === 0 && props.data.maxShields === 0) {
            return "#242424";
        }

        const percent = props.data.shields / props.data.maxShields;

        const g = 255 * percent;
        const r = 255 - 255 * percent;
        return "rgb(" + r + "," + g + ",0,0.2)";
    };

    const getNewHpValue = (input: string, maxValue: number) => {
        let value = 0;
        let factor = 1;
        if (allowNegativNumbers) {
            factor = input.startsWith("-") ? -1 : 1;
        }
        if (input.indexOf("+") > 0 || input.indexOf("-") > 0) {
            value = evalString(input);
        } else {
            value = Number(input.replace(/[^0-9]/g, ""));
        }
        const hp = Math.min(Number(value * factor), maxValue);
        return allowNegativNumbers ? hp : Math.max(hp, 0);
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
                    ref={shieldsRef}
                    type={"text"}
                    size={3}
                    defaultValue={data.shields}
                    onBlur={(e) => {
                        const input = e.target.value;
                        const shields = getNewHpValue(input, data.maxShields);
                        e.target.value = shields.toString();
                        handleValueChange(shields, "shields");
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            const shields = Math.min(data.shields + 1, data.maxShields);
                            handleValueChange(shields, "shields");
                            e.currentTarget.value = shields.toString();
                        } else if (e.key === "ArrowDown") {
                            const shields = Math.min(data.shields - 1, data.maxShields);
                            handleValueChange(shields, "shields");
                            e.currentTarget.value = shields.toString();
                        } else if (e.key === "Enter") {
                            const input = e.currentTarget.value;
                            const shields = getNewHpValue(input, data.maxShields);
                            e.currentTarget.value = shields.toString();
                            handleValueChange(shields, "shields");
                        }
                    }}
                />
                <span>/</span>
                <input
                    type={"text"}
                    size={3}
                    value={data.maxShields}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(Number(value), "maxShields", false);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            handleValueChange(data.maxShields + 1, "maxShields", true);
                        } else if (e.key === "ArrowDown") {
                            handleValueChange(data.maxShields - 1, "maxShields", true);
                        }
                    }}
                    onBlur={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(Number(value), "maxShields", true);
                    }}
                />
            </div>
            <div className={"current-hp current-armor"}>
                <input
                    ref={hp2Ref}
                    type={"text"}
                    size={3}
                    defaultValue={data.hp2}
                    onBlur={(e) => {
                        const input = e.target.value;
                        const hp2 = getNewHpValue(input, data.maxHp2);
                        e.target.value = hp2.toString();
                        handleValueChange(hp2, "hp2");
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            const hp2 = Math.min(data.hp2 + 1, data.maxHp2);
                            handleValueChange(hp2, "hp2");
                            e.currentTarget.value = hp2.toString();
                        } else if (e.key === "ArrowDown") {
                            const hp2 = Math.min(data.hp2 - 1, data.maxHp2);
                            handleValueChange(hp2, "hp2");
                            e.currentTarget.value = hp2.toString();
                        } else if (e.key === "Enter") {
                            const input = e.currentTarget.value;
                            const hp2 = getNewHpValue(input, data.maxHp2);
                            e.currentTarget.value = hp2.toString();
                            handleValueChange(hp2, "hp2");
                        }
                    }}
                />
                <span>/</span>
                <input
                    type={"text"}
                    size={3}
                    value={data.maxHp2}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(Number(value), "maxHP2", false);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            handleValueChange(data.maxHp2 + 1, "maxHP2", true);
                        } else if (e.key === "ArrowDown") {
                            handleValueChange(data.maxHp2 - 1, "maxHP2", true);
                        }
                    }}
                    onBlur={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleValueChange(Number(value), "maxHP2", true);
                    }}
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
