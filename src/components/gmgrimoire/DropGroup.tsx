import { Droppable } from "@hello-pangea/dnd";
import { DraggableTokenList } from "./TokenList.tsx";
import OBR, { Image, Metadata } from "@owlbear-rodeo/sdk";
import { DICE_ROLLER, GMGMetadata, SceneMetadata } from "../../helper/types.ts";
import { itemMetadataKey, metadataKey, prettySordidID } from "../../helper/variables.ts";
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
import { IDiceRoll, Operator } from "dddice-js";
import { dicePlusRoll, diceToRoll, getUserUuid, localRoll } from "../../helper/diceHelper.ts";
import { getRoomDiceUser, getTokenName } from "../../helper/helpers.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import { useRollLogContext } from "../../context/RollLogContext.tsx";
import { useRef, useState } from "react";
import { getDiceImage, getSvgForDiceType } from "../../helper/previewHelpers.tsx";
import { D20 } from "../svgs/dice/D20.tsx";
import { MapButton } from "./Token/MapButton.tsx";
import { PlayerButton } from "./Token/PlayerButton.tsx";
import { HPSvg } from "../svgs/HPSvg.tsx";
import { ACSvg } from "../svgs/ACSvg.tsx";
import { InitiativeSvg } from "../svgs/InitiativeSvg.tsx";
import { RestSvg } from "../svgs/RestSvg.tsx";
import Tippy from "@tippyjs/react";
import { useBattleContext } from "../../context/BattleContext.tsx";
import { FlagSvg } from "../svgs/FlagSvg.tsx";
import { BattleSvg } from "../svgs/BattleSvg.tsx";
import "./drop-group.scss";
import { updateItems } from "../../helper/obrHelper.ts";
import { useShallow } from "zustand/react/shallow";
import { isUndefined } from "lodash";

type DropGroupProps = {
    title: string;
    list: Array<Image>;
    selected: Array<string>;
    tokenLists: Map<string, Array<Image>>;
};

export const DropGroup = (props: DropGroupProps) => {
    const [room, scene, taSettings] = useMetadataContext(
        useShallow((state) => [state.room, state.scene, state.taSettings]),
    );
    const [rollerApi, initialized, theme, themes] = useDiceRoller(
        useShallow((state) => [state.rollerApi, state.initialized, state.theme, state.themes]),
    );
    const [groups, addGroup, removeGroup] = useBattleContext(
        useShallow((state) => [state.groups, state.addGroup, state.removeGroup]),
    );
    const addRoll = useRollLogContext(useShallow((state) => state.addRoll));
    const playerContext = usePlayerContext();
    const initButtonRef = useRef<HTMLButtonElement>(null);
    const defaultHidden = playerContext.role === "GM" && !!taSettings.gm_rolls_hidden;
    const [initHover, setInitHover] = useState<boolean>(false);
    const start = useRef<number>(0);
    let timeout: number;

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
            const initiativeDice = room?.initiativeDice ?? 20;
            const dieType = `d${initiativeDice}`;
            if (room?.diceRoller !== DICE_ROLLER.DDDICE) {
                return getSvgForDiceType(`d${room?.initiativeDice}`);
            } else {
                if (theme) {
                    const image = getDiceImage(theme, dieType, 0);
                    return image ?? <D20 />;
                } else {
                    return <D20 />;
                }
            }
        } catch {
            return <D20 />;
        }
    };

    const roll = async (dice: string, statblock: string, hidden: boolean, id: string, customThemeId?: string) => {
        if (room && theme) {
            let parsed: { dice: IDiceRoll[]; operator: Operator | undefined } | undefined = diceToRoll(
                dice,
                customThemeId ?? theme.id,
            );
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
        let result;
        if (room?.diceRoller === DICE_ROLLER.SIMPLE) {
            result = await localRoll(dice, "Initiative: Roll", addRoll, hidden, statblock);
        } else if (room?.diceRoller === DICE_ROLLER.DICE_PLUS) {
            result = await dicePlusRoll(dice, "Initiative: Roll", addRoll, hidden, statblock);
        }
        if (result) {
            return { value: result.total, id: id };
        }
    };

    const setInitiative = async (hidden: boolean) => {
        initButtonRef.current?.classList.add("rolling");
        const newInitiativeValues: Map<string, number> = new Map();
        const promises: Array<Promise<{ value: number; id: string } | undefined>> = [];

        for (const item of props.list) {
            const data = item.metadata[itemMetadataKey] as GMGMetadata;
            const dice = `1d${room?.initiativeDice ?? 20}+${data.stats.initiativeBonus}`;
            if (getRoomDiceUser(room, OBR.player.id)?.diceRendering && room?.diceRoller === DICE_ROLLER.DDDICE) {
                let customThemeId = undefined;
                if (OBR.player.id !== item.createdUserId) {
                    const diceUser = room?.diceUser?.find((u) => u.playerId == item.createdUserId);
                    if (diceUser && !isUndefined(themes?.findIndex((t) => t.id === diceUser.diceTheme))) {
                        customThemeId = diceUser.diceTheme;
                    }
                }
                promises.push(roll(dice, getTokenName(item), hidden, item.id, customThemeId));
            } else {
                promises.push(diceLessRoll(dice, getTokenName(item), hidden, item.id));
            }
        }

        const results = await Promise.all(promises);
        results.forEach((result) => {
            if (result) {
                newInitiativeValues.set(result.id, result.value);
            }
        });

        await updateItems(
            props.list.map((i) => i.id),
            (items) => {
                items.forEach((item) => {
                    const bonus = (item.metadata[itemMetadataKey] as GMGMetadata).stats.initiativeBonus;
                    const initiative =
                        newInitiativeValues.get(item.id) ??
                        Math.floor(Math.random() * (room?.initiativeDice ?? 20)) + 1 + bonus;
                    (item.metadata[itemMetadataKey] as GMGMetadata).initiative = initiative;
                    if (taSettings.sync_pretty_sordid) {
                        item.metadata[`${prettySordidID}/metadata`] = { count: String(initiative), active: false };
                    }
                });
            },
        );
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
                <div className={"group-general"}>
                    <Tippy content={props.title}>
                        <div className={"group-name"}>
                            <span>{props.title}</span>
                        </div>
                    </Tippy>
                    <Tippy content={groups.includes(props.title) ? "Remove from Battle" : "Add to Battle"}>
                        <button
                            className={`button battle-state ${groups.includes(props.title) ? "active" : ""}`}
                            onClick={() => {
                                if (groups.includes(props.title)) {
                                    removeGroup(props.title);
                                } else {
                                    addGroup(props.title);
                                }
                            }}
                        >
                            {groups.includes(props.title) ? <BattleSvg /> : <FlagSvg />}
                        </button>
                    </Tippy>
                </div>
                <div className={"settings"}>
                    <div className={"setting"}>
                        <HPSvg percent={100} name={"hp"} color={"#888888"} />
                        <MapButton
                            onClick={async () => {
                                await toggleHpOnMap(props.list, room);
                            }}
                            onContextMenu={async () => {
                                await toggleHpForPlayers(props.list);
                            }}
                            active={getHpOnMap(props.list)}
                            players={getHpForPlayers(props.list)}
                            tooltip={"Show HP on map (right click for players)"}
                        />
                    </div>
                    <div className={"setting"}>
                        <ACSvg />
                        <MapButton
                            onClick={async () => {
                                await toggleAcOnMap(props.list);
                            }}
                            onContextMenu={async () => {
                                await toggleAcForPlayers(props.list);
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
                            onClick={async () => {
                                await toggleTokenInPlayerList(props.list);
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
                                    room?.diceRoller === DICE_ROLLER.DDDICE
                                }
                                onPointerDown={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    start.current = Date.now();
                                    timeout = setTimeout(async () => {
                                        await updateItems(
                                            props.list.map((i) => i.id),
                                            (items) => {
                                                items.forEach((item) => {
                                                    (item.metadata[itemMetadataKey] as GMGMetadata).initiative = 0;
                                                });
                                            },
                                        );
                                    }, 1000);
                                }}
                                onPointerUp={async (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const now = Date.now();
                                    if (now - start.current < 1000) {
                                        clearTimeout(timeout);
                                        await setInitiative(defaultHidden);
                                    }
                                }}
                            >
                                <div className={"dice-preview"}>{getDicePreview()}</div>
                            </button>
                            <button
                                className={`self ${initHover ? "visible" : "hidden"}`}
                                disabled={
                                    getRoomDiceUser(room, playerContext.id)?.diceRendering &&
                                    !initialized &&
                                    room?.diceRoller === DICE_ROLLER.DDDICE
                                }
                                onClick={async () => {
                                    await setInitiative(!defaultHidden);
                                }}
                            >
                                {defaultHidden ? "SHOW" : "HIDE"}
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
