import React, { MouseEvent, useEffect, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../helper/variables.ts";
import { HPMode, HpTrackerMetadata } from "../../helper/types.ts";
import "./hp-tracker.scss";

type PlayerProps = {
    id: string;
    data: HpTrackerMetadata;
};

export const HPTracker = () => {
    return (
        <ContextWrapper>
            <Content />
        </ContextWrapper>
    );
};

const Player = (props: PlayerProps) => {
    const playerContext = usePlayerContext();
    const [hp, setHp] = useState<number>(props.data.hp);
    const [maxHp, setMaxHp] = useState<number>(props.data.maxHp);
    const [armorClass, setArmorClass] = useState<number>(props.data.armorClass);
    const [hpMode, setHpMode] = useState<HPMode>(props.data.hpMode);
    const [hpOnMap, setHpOnMap] = useState<boolean>(props.data.hpOnMap);
    const [acOnMap, setAcOnMap] = useState<boolean>(props.data.acOnMap);
    const [canPlayersSee, setCanPlayersSee] = useState<boolean>(props.data.canPlayersSee);
    const [editName, setEditName] = useState<boolean>(false);
    const [name, setName] = useState<string>(props.data.name);

    const handleHpChange = (value: number) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.hp = value;
                setHp(currentData.hp);
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleMaxHpChange = (value: number) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.maxHp = value;
                if (currentData.maxHp < currentData.hp) {
                    currentData.hp = currentData.maxHp;
                    setHp(currentData.hp);
                }
                setMaxHp(currentData.maxHp);
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleAcChange = (value: number) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.armorClass = value;
                setArmorClass(currentData.armorClass);
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleHpModeClick = () => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.hpMode = hpMode === "NUM" ? "BAR" : "NUM";
                setHpMode(currentData.hpMode);
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleHpOnMapClick = () => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.hpOnMap = !hpOnMap;
                setHpOnMap(!hpOnMap);
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleAcOnMapClick = () => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.acOnMap = !acOnMap;
                setAcOnMap(!acOnMap);
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleCanPlayersSeeClick = () => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.canPlayersSee = !canPlayersSee;
                setCanPlayersSee(!canPlayersSee);
                // just assigning currentData did not trigger onChange event. Spreading helps
                item.metadata[characterMetadata] = { ...currentData };
            });
        });
    };

    const handleNameChange = (value: string) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[characterMetadata] as HpTrackerMetadata;
                currentData.name = value;
                setName(value);
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
            className={"player-wrapper"}
            style={{ background: `linear-gradient(to right, ${getBgColor()}, #242424 50%, #242424 )` }}
        >
            <div className={"player-name"}>
                {editName ? (
                    <input
                        className={"edit-name"}
                        type={"text"}
                        value={name}
                        onChange={(e) => {
                            handleNameChange(e.target.value);
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
            <div className={"settings"}>
                {playerContext.role === "GM" ? (
                    <>
                        <button
                            title={"Toggle HP Display Mode for Character"}
                            className={`toggle-button hp ${hpMode === "NUM" ? "numbers" : "bar"}`}
                            onClick={handleHpModeClick}
                        ></button>
                        <button
                            title={"Toggle HP displayed on Map"}
                            className={`toggle-button map ${hpOnMap ? "on" : "off"}`}
                            onClick={handleHpOnMapClick}
                        ></button>
                        <button
                            title={"Toggle AC visible on Map"}
                            className={`toggle-button ac ${acOnMap ? "on" : "off"}`}
                            onClick={handleAcOnMapClick}
                        ></button>
                        <button
                            title={"Toggle HP visible for players"}
                            className={`toggle-button players ${canPlayersSee ? "on" : "off"}`}
                            onClick={handleCanPlayersSeeClick}
                        ></button>{" "}
                    </>
                ) : null}
            </div>
            <div className={"current-hp"}>
                <input
                    type={"text"}
                    size={3}
                    value={hp}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleHpChange(Math.min(Number(value), maxHp));
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            handleHpChange(Math.min(hp + 1, maxHp));
                        } else if (e.key === "ArrowDown") {
                            handleHpChange(Math.min(hp - 1, maxHp));
                        }
                    }}
                    onWheel={(e) => {
                        if (e.deltaY > 0) {
                            handleHpChange(Math.min(hp - 1, maxHp));
                        } else if (e.deltaY < 0) {
                            handleHpChange(Math.min(hp + 1, maxHp));
                        }
                    }}
                />
                <span>/</span>
                <input
                    type={"text"}
                    size={3}
                    value={maxHp}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        handleMaxHpChange(Number(value));
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            handleMaxHpChange(maxHp + 1);
                        } else if (e.key === "ArrowDown") {
                            handleMaxHpChange(maxHp - 1);
                        }
                    }}
                    onWheel={(e) => {
                        if (e.deltaY > 0) {
                            handleMaxHpChange(maxHp - 1);
                        } else if (e.deltaY < 0) {
                            handleMaxHpChange(maxHp + 1);
                        }
                    }}
                />
            </div>
            <input
                type={"text"}
                size={1}
                value={armorClass}
                onChange={(e) => {
                    const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                    handleAcChange(value);
                }}
                onKeyDown={(e) => {
                    if (e.key === "ArrowUp") {
                        handleAcChange(armorClass + 1);
                    } else if (e.key === "ArrowDown") {
                        handleAcChange(armorClass - 1);
                    }
                }}
                onWheel={(e) => {
                    if (e.deltaY > 0) {
                        handleAcChange(armorClass - 1);
                    } else if (e.deltaY < 0) {
                        handleAcChange(armorClass + 1);
                    }
                }}
                className={"armor-class"}
            />
        </div>
    ) : (
        <></>
    );
};

const Content = () => {
    const playerContext = usePlayerContext();
    const [tokens, setTokens] = useState<Item[] | undefined>(undefined);
    const [isReady, setIsReady] = useState<boolean>(false);

    const initHpTracker = async () => {
        const initialItems = await OBR.scene.items.getItems((item) => item.layer === "CHARACTER");
        setTokens(initialItems);

        OBR.scene.items.onChange(async (items) => {
            const filteredItems = items.filter((item) => item.layer === "CHARACTER");
            setTokens(Array.from(filteredItems));
        });
    };

    const initIsReady = async () => {
        setIsReady(await OBR.scene.isReady());
    };

    useEffect(() => {
        OBR.scene.onReadyChange(async (ready) => {
            setIsReady(ready);
        });
        initIsReady();
    }, []);

    useEffect(() => {
        if (isReady) {
            initHpTracker();
        }
    }, [isReady]);

    return playerContext.role ? (
        <div className={"hp-tracker"}>
            <h1 className={"title"}>HP Tracker</h1>
            <div className={"player-wrapper"}>
                <span>Name</span>
                <span>Settings</span>
                <span>HP / MAX</span>
                <span className={"armor-class"}>AC</span>
            </div>
            {tokens?.map((token) => {
                const data = token.metadata[characterMetadata] as HpTrackerMetadata;
                if (data) {
                    return <Player key={token.id} id={token.id} data={data} />;
                }
                return null;
            })}
        </div>
    ) : (
        <h1>Waiting for OBR startup</h1>
    );
};
