import { ContextWrapper } from "../ContextWrapper.tsx";
import { useEffect, useRef, useState } from "react";
import { Token } from "../hptracker/Token.tsx";
import OBR, { Image } from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { Loader } from "../general/Loader.tsx";
import { updateHp } from "../../helper/hpHelpers.ts";
import { getBgColor } from "../../helper/helpers.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import {
    getAcOnMap,
    getCanPlayersSee,
    getHpBar,
    getHpOnMap,
    toggleAcOnMap,
    toggleCanPlayerSee,
    toggleHpBar,
    toggleHpOnMap,
} from "../../helper/multiTokenHelper.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useTokenListContext } from "../../context/TokenContext.tsx";
import { TokenContextWrapper } from "../TokenContextWrapper.tsx";

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
    const tokens = useTokenListContext((state) => state.tokens);
    const inputRef = useRef<HTMLInputElement>(null);
    const { room } = useMetadataContext();
    const playerContext = usePlayerContext();
    const items = tokens ? [...tokens.values()].filter((v) => ids.includes(v.item.id)).map((v) => v.item) : [];

    const changeHP = async (value: number) => {
        await OBR.scene.items.updateItems(items, (uItems) => {
            uItems.forEach((item) => {
                if (itemMetadataKey in item.metadata) {
                    const itemData = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                    const newHp = itemData.hp + value;
                    if (newHp < itemData.hp && itemData.stats.tempHp && itemData.stats.tempHp > 0) {
                        itemData.stats.tempHp = Math.max(itemData.stats.tempHp - (itemData.hp - newHp), 0);
                    }
                    itemData.hp = Math.min(
                        room?.allowNegativeNumbers ? newHp : Math.max(newHp, 0),
                        itemData.maxHp + (itemData.stats.tempHp || 0)
                    );
                    const uItem = items.find((i) => i.id === item.id);
                    if (uItem && itemMetadataKey in uItem.metadata) {
                        const uItemData = uItem.metadata[itemMetadataKey] as HpTrackerMetadata;
                        updateHp(uItem, {
                            ...uItemData,
                            hp: itemData.hp,
                            stats: { ...uItemData.stats, tempHp: itemData.stats.tempHp },
                        });
                    }
                    item.metadata[itemMetadataKey] = { ...itemData };
                }
            });
        });
    };

    return (
        <div className={"popover multi-selection"}>
            <ul className={"token-names"}>
                {items?.map((item, index) => {
                    if (itemMetadataKey in item.metadata) {
                        const d = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                        return (
                            <li
                                className={"token-entry"}
                                key={index}
                                style={{
                                    background: `linear-gradient(to right, ${getBgColor(
                                        d,
                                        "0.4"
                                    )}, #1C1B22 90%, #1C1B22 )`,
                                }}
                            >
                                {d.name}
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
                        <button
                            title={"Toggle HP Bar visibility for GM and Players"}
                            className={`toggle-button hp ${getHpBar(items) ? "on" : "off"}`}
                            onClick={() => {
                                toggleHpBar(items);
                            }}
                        />
                        <button
                            title={"Toggle HP displayed on Map"}
                            className={`toggle-button map ${getHpOnMap(items) ? "on" : "off"}`}
                            onClick={() => {
                                toggleHpOnMap(items);
                            }}
                        />
                        <button
                            title={"Toggle AC displayed on Map"}
                            className={`toggle-button ac ${getAcOnMap(items) ? "on" : "off"}`}
                            onClick={async () => {
                                toggleAcOnMap(items);
                            }}
                        />
                        <button
                            title={"Toggle HP/AC visibility for players"}
                            className={`toggle-button players ${getCanPlayersSee(items) ? "on" : "off"}`}
                            onClick={() => {
                                toggleCanPlayerSee(items);
                            }}
                        />{" "}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

const Content = (props: { id: string }) => {
    const id = props.id;
    const token = useTokenListContext((state) => state.tokens?.get(props.id));
    const data = token?.data as HpTrackerMetadata;
    const item = token?.item as Image;

    return id && data && item ? (
        <div className={"popover"}>
            <Token id={id} popover={true} selected={false} />
        </div>
    ) : null;
};
