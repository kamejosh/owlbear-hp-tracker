import { Droppable } from "react-beautiful-dnd";
import { DraggableTokenList } from "./TokenList.tsx";
import OBR, { Item, Metadata } from "@owlbear-rodeo/sdk";
import { HpTrackerMetadata, SceneMetadata } from "../../helper/types.ts";
import { itemMetadataKey, metadataKey } from "../../helper/variables.ts";
import {
    getAcForPlayers,
    getAcOnMap,
    getHpForPlayers,
    getHpOnMap,
    getTokenInPlayerList,
    rest,
    toggleAcForPlayers,
    toggleAcOnMap,
    toggleHpForPlayers,
    toggleHpOnMap,
    toggleTokenInPlayerList,
} from "../../helper/multiTokenHelper.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useDiceRoller } from "../../context/DDDiceContext.tsx";
import { IDiceRoll, Operator, parseRollEquation } from "dddice-js";
import { diceToRoll, getUserUuid, localRoll } from "../../helper/diceHelper.ts";
import { getRoomDiceUser } from "../../helper/helpers.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import { useRollLogContext } from "../../context/RollLogContext.tsx";
import { useRef, useState } from "react";
import { getDiceImage, getSvgForDiceType } from "../../helper/previewHelpers.tsx";
import { D20 } from "../svgs/dice/D20.tsx";
import "./drop-group.scss";
import { MapButton } from "./Token/MapButton.tsx";
import { PlayerButton } from "./Token/PlayerButton.tsx";
import { HPSvg } from "../svgs/HPSvg.tsx";
import { ACSvg } from "../svgs/ACSvg.tsx";
import { InitiativeSvg } from "../svgs/InitiativeSvg.tsx";
import { RestSvg } from "../svgs/RestSvg.tsx";

type DropGroupProps = {
    title: string;
    list: Array<Item>;
    selected: Array<string>;
    tokenLists: Map<string, Array<Item>>;
};

export const DropGroup = (props: DropGroupProps) => {
    const [room, scene] = useMetadataContext((state) => [state.room, state.scene]);
    const [rollerApi, initialized, theme] = useDiceRoller((state) => [state.rollerApi, state.initialized, state.theme]);
    const addRoll = useRollLogContext((state) => state.addRoll);
    const playerContext = usePlayerContext();
    const initButtonRef = useRef<HTMLButtonElement>(null);

    const [initHover, setInitHover] = useState<boolean>(false);

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

    const getDicePreview = () => {
        try {
            const parsed = parseRollEquation(`1d${room?.initiativeDice}`, "dddice-bees");
            const die = parsed.dice.find((d) => d.type !== "mod");
            if (die) {
                if (room?.disableDiceRoller) {
                    return getSvgForDiceType(`d${room.initiativeDice}`);
                } else {
                    if (theme) {
                        const image = getDiceImage(theme, die, 0);
                        return image ?? <D20 />;
                    } else {
                        return <D20 />;
                    }
                }
            } else {
                return <D20 />;
            }
        } catch {
            return <D20 />;
        }
    };

    const roll = async (dice: string, statblock: string, hidden: boolean, id: string) => {
        if (room && theme) {
            let parsed: { dice: IDiceRoll[]; operator: Operator | undefined } | undefined = diceToRoll(dice, theme.id);
            if (parsed) {
                const r = await rollerApi?.roll.create(parsed.dice, {
                    operator: parsed.operator,
                    external_id: statblock,
                    label: "Initiative: Roll",
                    whisper: hidden ? await getUserUuid(room, rollerApi) : undefined,
                });
                return {
                    value: Number(r?.data.total_value),
                    id: id,
                };
            }
        }
    };

    const diceLessRoll = async (dice: string, statblock: string, hidden: boolean, id: string) => {
        const result = await localRoll(dice, "Initiative: Roll", addRoll, hidden, statblock);
        if (result) {
            return { value: result.total, id: id };
        }
    };

    const setInitiative = async (hidden: boolean) => {
        initButtonRef.current?.classList.add("rolling");
        const newInitiativeValues: Map<string, number> = new Map();
        const promises: Array<Promise<{ value: number; id: string } | undefined>> = [];

        for (const item of props.list) {
            const data = item.metadata[itemMetadataKey] as HpTrackerMetadata;
            const dice = `1d${room?.initiativeDice ?? 20}+${data.stats.initiativeBonus}`;
            if (getRoomDiceUser(room, OBR.player.id)?.diceRendering && !room?.disableDiceRoller) {
                promises.push(roll(dice, data.name, hidden, item.id));
            } else {
                promises.push(diceLessRoll(dice, data.name, hidden, item.id));
            }
        }

        const results = await Promise.all(promises);
        results.forEach((result) => {
            if (result) {
                newInitiativeValues.set(result.id, result.value);
            }
        });

        await OBR.scene.items.updateItems(props.list, (items) => {
            items.forEach((item) => {
                const bonus = (item.metadata[itemMetadataKey] as HpTrackerMetadata).stats.initiativeBonus;
                (item.metadata[itemMetadataKey] as HpTrackerMetadata).initiative =
                    newInitiativeValues.get(item.id) ??
                    Math.floor(Math.random() * (room?.initiativeDice ?? 20)) + 1 + bonus;
            });
        });
        initButtonRef.current?.classList.remove("rolling");
        initButtonRef.current?.blur();
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
                    <div className={"setting"}>
                        <HPSvg percent={100} name={"hp"} color={"#888888"} />
                        <MapButton
                            onClick={() => {
                                toggleHpOnMap(props.list);
                            }}
                            onContextMenu={() => {
                                toggleHpForPlayers(props.list);
                            }}
                            active={getHpOnMap(props.list)}
                            players={getHpForPlayers(props.list)}
                            tooltip={"Show HP on map (right click for players)"}
                        />
                    </div>
                    <div className={"setting"}>
                        <ACSvg />
                        <MapButton
                            onClick={() => {
                                toggleAcOnMap(props.list);
                            }}
                            onContextMenu={() => {
                                toggleAcForPlayers(props.list);
                            }}
                            active={getAcOnMap(props.list)}
                            players={getAcForPlayers(props.list)}
                            tooltip={"Show AC on map (right click for players)"}
                        />
                    </div>
                    <div className={"setting"}>
                        <InitiativeSvg />
                        <PlayerButton
                            active={getTokenInPlayerList(props.list)}
                            onClick={() => {
                                toggleTokenInPlayerList(props.list);
                            }}
                        />
                        <div
                            className={"init-wrapper button-wrapper"}
                            onMouseEnter={() => {
                                setInitHover(true);
                            }}
                            onMouseLeave={() => setInitHover(false)}
                        >
                            <button
                                ref={initButtonRef}
                                title={"Roll Initiative (including initiative modifier from statblock)"}
                                className={`dice-button button`}
                                disabled={
                                    getRoomDiceUser(room, playerContext.id)?.diceRendering &&
                                    !initialized &&
                                    !room?.disableDiceRoller
                                }
                                onClick={async () => {
                                    await setInitiative(false);
                                }}
                            >
                                <div className={"dice-preview"}>{getDicePreview()}</div>
                            </button>
                            <button
                                className={`self ${initHover ? "visible" : "hidden"}`}
                                disabled={
                                    getRoomDiceUser(room, playerContext.id)?.diceRendering &&
                                    !initialized &&
                                    !room?.disableDiceRoller
                                }
                                onClick={async () => {
                                    await setInitiative(true);
                                }}
                            >
                                HIDE
                            </button>
                        </div>
                    </div>
                    <div className={"setting"}>
                        <RestSvg color={"#888888"} />
                        <button
                            className={"button short"}
                            onClick={() => {
                                rest(props.list, "Short Rest");
                            }}
                        >
                            short
                        </button>
                        <button
                            className={"button long"}
                            onClick={() => {
                                rest(props.list, "Long Rest");
                            }}
                        >
                            long
                        </button>
                    </div>
                </div>

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
