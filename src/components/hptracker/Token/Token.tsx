import { HpTrackerMetadata } from "../../../helper/types.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import React, { useEffect, useRef } from "react";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../../helper/variables.ts";
import { getBgColor } from "../../../helper/helpers.ts";
import _ from "lodash";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { changeArmorClass, changeHp } from "../../../helper/tokenHelper.ts";
import { HP } from "./HP.tsx";
import { AC } from "./AC.tsx";
import { Initiative } from "./Initiative.tsx";
import { Sheet } from "./Sheet.tsx";
import { TokenIcon } from "./TokenIcon.tsx";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import { Rest } from "./Rest.tsx";

type TokenProps = {
    id: string;
    popover: boolean;
    selected: boolean;
    tokenLists?: Map<string, Array<Item>>;
};

export const Token = (props: TokenProps) => {
    const component = useComponentContext((state) => state.component);
    const playerContext = usePlayerContext();
    const room = useMetadataContext((state) => state.room);
    const containerRef = useRef<HTMLDivElement>(null);
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
        if (e.target !== containerRef.current) {
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

    const display = (): boolean => {
        return (
            data.hpTrackerActive &&
            (playerContext.role === "GM" ||
                item.createdUserId === playerContext.id ||
                (!!data.playerMap?.hp && !!data.playerMap?.ac && !!data.playerList))
        );
    };

    return display() ? (
        <div
            ref={containerRef}
            className={`token ${playerContext.role === "PLAYER" ? "player" : ""} ${
                props.selected ? "selected" : ""
            } ${component}`}
            style={{
                background: `linear-gradient(to right, ${getBgColor(data)}, #1C1B22 50%, #1C1B22 )`,
            }}
            onClick={(e) => {
                handleOnPlayerClick(e);
            }}
        >
            <TokenIcon id={props.id} />
            <HP id={props.id} />
            <AC id={props.id} />
            <Initiative id={props.id} />
            {props.popover ? null : playerContext.role === "GM" || item.createdUserId === playerContext.id ? (
                <>
                    <Sheet id={props.id} />
                    <Rest id={props.id} />
                </>
            ) : null}
        </div>
    ) : data.playerList && item.visible ? (
        <div
            className={"token"}
            style={{ background: `linear-gradient(to right, ${getBgColor(data)}, #242424 50%, #242424 )` }}
        >
            <TokenIcon id={props.id} />
        </div>
    ) : (
        <></>
    );
};
