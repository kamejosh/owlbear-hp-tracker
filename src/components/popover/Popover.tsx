import { ContextWrapper } from "../ContextWrapper.tsx";
import { useEffect, useRef, useState } from "react";
import { Token } from "../gmgrimoire/Token/Token.tsx";
import OBR, { Image } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../helper/variables.ts";
import { GMGMetadata } from "../../helper/types.ts";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { Loader } from "../general/Loader.tsx";
import { updateHp } from "../../helper/hpHelpers.ts";
import { getBgColor, getTokenName } from "../../helper/helpers.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import {
    getAcForPlayers,
    getAcOnMap,
    getHpForPlayers,
    getHpOnMap,
    getTokenInPlayerList,
    toggleAcForPlayers,
    toggleAcOnMap,
    toggleHpForPlayers,
    toggleHpOnMap,
    toggleTokenInPlayerList,
} from "../../helper/multiTokenHelper.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useTokenListContext } from "../../context/TokenContext.tsx";
import { TokenContextWrapper } from "../TokenContextWrapper.tsx";
import { MapButton } from "../gmgrimoire/Token/MapButton.tsx";
import { PlayerButton } from "../gmgrimoire/Token/PlayerButton.tsx";
import { HPSvg } from "../svgs/HPSvg.tsx";
import { ACSvg } from "../svgs/ACSvg.tsx";
import { InitiativeSvg } from "../svgs/InitiativeSvg.tsx";
import { updateItems } from "../../helper/obrHelper.ts";
import { useShallow } from "zustand/react/shallow";

export const Popover = () => {
    const [ids, setIds] = useState<Array<string>>([]);
    const { isReady } = SceneReadyContext();

    const initPopover = async () => {
        const selection = await OBR.player.getSelection();
        setIds(selection ?? []);
    };

    useEffect(() => {
        if (isReady) {
            initPopover();
        }
    }, [isReady]);

    return (
        <ContextWrapper component={"popover"}>
            <TokenContextWrapper>
                {ids.length === 1 ? (
                    <Content id={ids[0]} />
                ) : ids.length > 1 ? (
                    <MultiContent ids={ids} />
                ) : (
                    <Loader className={"popover-spinner"} />
                )}
            </TokenContextWrapper>
        </ContextWrapper>
    );
};

const MultiContent = ({ ids }: { ids: Array<string> }) => {
    const tokens = useTokenListContext(useShallow((state) => state.tokens));
    const inputRef = useRef<HTMLInputElement>(null);
    const { room } = useMetadataContext();
    const playerContext = usePlayerContext();
    const items = tokens ? [...tokens.values()].filter((v) => ids.includes(v.item.id)).map((v) => v.item) : [];

    const changeHP = async (value: number) => {
        await updateItems(
            items.map((i) => i.id),
            (uItems) => {
                uItems.forEach((item) => {
                    if (itemMetadataKey in item.metadata) {
                        const itemData = item.metadata[itemMetadataKey] as GMGMetadata;
                        const newHp = itemData.hp + value;
                        if (newHp < itemData.hp && itemData.stats.tempHp && itemData.stats.tempHp > 0) {
                            itemData.stats.tempHp = Math.max(itemData.stats.tempHp - (itemData.hp - newHp), 0);
                        }
                        itemData.hp = Math.min(
                            room?.allowNegativeNumbers ? newHp : Math.max(newHp, 0),
                            itemData.maxHp + (itemData.stats.tempHp || 0),
                        );
                        const uItem = items.find((i) => i.id === item.id);
                        if (uItem && itemMetadataKey in uItem.metadata) {
                            const uItemData = uItem.metadata[itemMetadataKey] as GMGMetadata;
                            updateHp(uItem, {
                                ...uItemData,
                                hp: itemData.hp,
                                stats: { ...uItemData.stats, tempHp: itemData.stats.tempHp },
                            });
                        }
                        item.metadata[itemMetadataKey] = { ...itemData };
                    }
                });
            },
        );
    };

    return (
        <div className={"popover multi-selection"}>
            <ul className={"token-names"}>
                {items?.map((item, index) => {
                    if (itemMetadataKey in item.metadata) {
                        const d = item.metadata[itemMetadataKey] as GMGMetadata;
                        return (
                            <li
                                className={"token-entry"}
                                key={index}
                                style={{
                                    background: `linear-gradient(to right, ${getBgColor(
                                        d,
                                        "0.4",
                                    )}, #1C1B22 90%, #1C1B22 )`,
                                }}
                            >
                                {getTokenName(item)}
                            </li>
                        );
                    }
                })}
            </ul>
            <div className={"changes"}>
                <div className={"hp"}>
                    <input className={"input"} ref={inputRef} type={"number"} defaultValue={0} />
                    <button
                        className={"heal"}
                        title={"heal"}
                        onClick={() => {
                            if (inputRef.current) {
                                changeHP(parseInt(inputRef.current.value));
                            }
                        }}
                    >
                        Heal
                    </button>
                    <button
                        className={"damage"}
                        title={"damage"}
                        onClick={() => {
                            if (inputRef.current) {
                                changeHP(parseInt(inputRef.current.value) * -1);
                            }
                        }}
                    >
                        Damage
                    </button>
                </div>
                {playerContext.role === "GM" ? (
                    <div className={"settings"}>
                        <div className={"setting"}>
                            <HPSvg percent={100} name={"hp"} color={"#888888"} />
                            <MapButton
                                onClick={async () => {
                                    await toggleHpOnMap(items, room);
                                }}
                                onContextMenu={async () => {
                                    await toggleHpForPlayers(items);
                                }}
                                active={getHpOnMap(items)}
                                players={getHpForPlayers(items)}
                                tooltip={"Show HP on map (right click for players)"}
                            />
                        </div>
                        <div className={"setting"}>
                            <ACSvg />
                            <MapButton
                                onClick={async () => {
                                    await toggleAcOnMap(items);
                                }}
                                onContextMenu={async () => {
                                    await toggleAcForPlayers(items);
                                }}
                                active={getAcOnMap(items)}
                                players={getAcForPlayers(items)}
                                tooltip={"Show AC on map (right click for players)"}
                            />
                        </div>
                        <div className={"setting"}>
                            <InitiativeSvg />
                            <PlayerButton
                                active={getTokenInPlayerList(items)}
                                onClick={() => {
                                    toggleTokenInPlayerList(items);
                                }}
                            />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const Content = (props: { id: string }) => {
    const id = props.id;
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(props.id)));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;

    return id && data && item ? (
        <div className={"popover"}>
            <Token id={id} popover={true} selected={false} />
        </div>
    ) : null;
};
