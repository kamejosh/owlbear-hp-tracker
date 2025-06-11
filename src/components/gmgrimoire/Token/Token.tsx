import { GMGMetadata } from "../../../helper/types.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import React, { useEffect, useRef } from "react";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../../helper/variables.ts";
import { getBgColor } from "../../../helper/helpers.ts";
import _ from "lodash";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { changeArmorClass, changeHp, updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { HP } from "./HP.tsx";
import { AC } from "./AC.tsx";
import { Initiative } from "./Initiative.tsx";
import { Sheet } from "./Sheet.tsx";
import { TokenIcon } from "./TokenIcon.tsx";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import { Rest } from "./Rest.tsx";
import { useBattleContext } from "../../../context/BattleContext.tsx";
import { useShallow } from "zustand/react/shallow";

type TokenProps = {
    id: string;
    popover: boolean;
    selected: boolean;
    tokenLists?: Map<string, Array<Item>>;
    isDragging?: boolean;
};

export const Token = (props: TokenProps) => {
    const component = useComponentContext(useShallow((state) => state.component));
    const playerContext = usePlayerContext();
    const room = useMetadataContext(useShallow((state) => state.room));
    const containerRef = useRef<HTMLDivElement>(null);
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(props.id)));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;
    const [current, next] = useBattleContext(useShallow((state) => [state.current, state.next]));
    const showNext = item.createdUserId === playerContext.id && data.isNext;
    const start = useRef<number>(0);

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

    useEffect(() => {
        if (
            playerContext.role === "GM" &&
            ((!data.isCurrent && current === item.id) ||
                (!!data.isCurrent && current !== item.id) ||
                (!data.isNext && next === item.id) ||
                (!!data.isNext && next !== item.id))
        ) {
            updateTokenMetadata({ ...data, isCurrent: current === item.id, isNext: next === item.id }, [props.id]);
        }
    }, [current, next, playerContext]);

    useEffect(() => {
        if (data.isCurrent && containerRef.current) {
            containerRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
        }
    }, [data.isCurrent]);

    const getGroupSelectRange = (currentSelection: Array<string>): Array<string> | null => {
        const currentGroup = data.group;

        if (currentGroup || currentGroup === undefined) {
            const groupItems = props.tokenLists?.get(currentGroup || "Default");
            if (groupItems) {
                const index = data.index || groupItems.indexOf(item);
                const selectedGroupItems = groupItems.filter((item) => currentSelection.includes(item.id));

                const sortedByDistance = selectedGroupItems.sort((a, b) => {
                    const aData = a.metadata[itemMetadataKey] as GMGMetadata;
                    const bData = b.metadata[itemMetadataKey] as GMGMetadata;
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
                    const cdData = closestDistance.metadata[itemMetadataKey] as GMGMetadata;

                    const cdIndex = cdData.index || groupItems.indexOf(closestDistance);
                    let indices: Array<number> = [];
                    if (cdIndex < index) {
                        indices = _.range(cdIndex, index);
                    } else {
                        indices = _.range(index, cdIndex);
                    }
                    const toSelect = groupItems.map((item) => {
                        const itemData = item.metadata[itemMetadataKey] as GMGMetadata;
                        if (itemData.index) {
                            if (indices.includes(itemData.index)) {
                                return item.id;
                            }
                        } else {
                            const idx = groupItems.indexOf(item);
                            if (indices.includes(idx)) {
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

    const handleOnPlayerClick = async (e: React.MouseEvent<HTMLDivElement>, force?: boolean) => {
        if (!force && (e.target as HTMLElement).tagName !== "DIV") {
            // we prevent subcomponent clicking triggering this function
            return;
        }
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

    const handleOnPlayerDoubleClick = async (
        e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>,
    ) => {
        if ((e.target as HTMLElement).tagName !== "DIV") {
            // we prevent subcomponent clicking triggering this function
            return;
        }
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
                item.createdUserId === playerContext.id ||
                (!!data.playerMap?.hp && !!data.playerMap?.ac && data.hpOnMap && data.acOnMap && !!data.playerList))
        );
    };

    return display() ? (
        <div
            ref={containerRef}
            className={`token ${playerContext.role === "PLAYER" ? "player" : ""} ${
                props.selected ? "selected" : ""
            } ${component} ${data.isCurrent ? "current" : ""} ${showNext ? "next" : ""}`}
            style={{
                background: `linear-gradient(to right, ${getBgColor(data)}, #1C1B22 50%, #1C1B22 )`,
            }}
            onClick={(e) => {
                handleOnPlayerClick(e);
            }}
            onDoubleClick={(e) => {
                handleOnPlayerDoubleClick(e);
            }}
            onTouchStart={(e) => {
                const now = Date.now();
                if (now - start.current < 300) {
                    handleOnPlayerDoubleClick(e);
                } else {
                    start.current = now;
                }
            }}
        >
            <TokenIcon
                id={props.id}
                onClick={async (e) => {
                    handleOnPlayerClick(e, true);
                }}
                hideName={!display()}
                isDragging={props.isDragging}
            />
            <HP id={props.id} />
            <AC id={props.id} />
            <Initiative id={props.id} />
            {props.popover ? null : playerContext.role === "GM" || item.createdUserId === playerContext.id ? (
                <>
                    {playerContext.role === "GM" || data.sheet ? <Sheet id={props.id} /> : null}
                    <Rest id={props.id} />
                </>
            ) : null}
        </div>
    ) : data.playerList && item.visible ? (
        <div
            ref={containerRef}
            className={`token ${data.isCurrent ? "current" : ""}`}
            style={{
                background: `linear-gradient(to right, ${getBgColor(data, "0.2", playerContext.role === "PLAYER" && room?.disableColorGradient, "#1F1E26")}, #1F1E26 50%, #1F1E26 )`,
            }}
        >
            <TokenIcon id={props.id} hideName={!display()} />
        </div>
    ) : (
        <></>
    );
};
