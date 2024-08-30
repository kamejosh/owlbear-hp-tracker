import {
    changeHp,
    changeMaxHp,
    changeTempHp,
    getNewHpValue,
    updateTokenMetadata,
} from "../../../helper/tokenHelper.ts";
import { useEffect, useRef } from "react";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import _ from "lodash";
import { HPSvg } from "../../svgs/HPSvg.tsx";
import "./hp.scss";
import { MapButton } from "./MapButton.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { updateHp } from "../../../helper/hpHelpers.ts";
import Tippy from "@tippyjs/react";

export const HP = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const hpRef = useRef<HTMLInputElement>(null);
    const maxHpRef = useRef<HTMLInputElement>(null);
    const tempHpRef = useRef<HTMLInputElement>(null);
    const room = useMetadataContext((state) => state.room);
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const data = token?.data as HpTrackerMetadata;
    const item = token?.item as Image;

    useEffect(() => {
        if (hpRef && hpRef.current) {
            hpRef.current.value = String(data?.hp);
        }
    }, [data?.hp]);

    useEffect(() => {
        if (maxHpRef && maxHpRef.current) {
            maxHpRef.current.value = String(data?.maxHp);
        }
    }, [data?.maxHp]);

    useEffect(() => {
        if (tempHpRef && tempHpRef.current && _.isNumber(data?.stats?.tempHp)) {
            tempHpRef.current.value = String(data?.stats?.tempHp);
        }
    }, [data?.stats?.tempHp]);

    return (
        <div className={"token-hp"}>
            <HPSvg percent={(data.hp / (data.maxHp + (data.stats.tempHp ?? 0))) * 100} name={item.id} />
            {data.stats.tempHp ? (
                <HPSvg percent={100} name={"tempHp"} className={"temp-hp-icon"} color={"#2248ff"} />
            ) : null}
            <div className={"current-hp"}>
                <Tippy content={"Set current HP"}>
                    <input
                        ref={hpRef}
                        type={"text"}
                        defaultValue={data.hp}
                        onBlur={(e) => {
                            const input = e.target.value;
                            const hp = getNewHpValue(input, data, item, maxHpRef, room);
                            if (hp !== null) {
                                e.target.value = String(hp);
                                changeHp(hp, data, item, hpRef, tempHpRef, room);
                            }
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                                const hp = Math.min(
                                    data.hp + 1,
                                    data.stats.tempHp ? data.maxHp + data.stats.tempHp : data.maxHp
                                );
                                changeHp(hp, data, item, hpRef, tempHpRef, room);
                                e.currentTarget.value = String(hp);
                            } else if (e.key === "ArrowDown") {
                                const hp = Math.min(
                                    data.hp - 1,
                                    data.stats.tempHp ? data.maxHp + data.stats.tempHp : data.maxHp
                                );
                                changeHp(hp, data, item, hpRef, tempHpRef, room);
                                e.currentTarget.value = String(hp);
                            } else if (e.key === "Enter") {
                                const input = e.currentTarget.value;
                                const hp = getNewHpValue(input, data, item, maxHpRef, room);
                                if (hp !== null) {
                                    e.currentTarget.value = String(hp);
                                    changeHp(hp, data, item, hpRef, tempHpRef, room);
                                }
                            }
                        }}
                    />
                </Tippy>
                <span className={"divider"}></span>
                <Tippy content={"Set max HP"}>
                    <input
                        type={"text"}
                        ref={maxHpRef}
                        defaultValue={data.maxHp}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                                changeMaxHp(data.maxHp + 1, data, item, maxHpRef);
                            } else if (e.key === "ArrowDown") {
                                changeMaxHp(data.maxHp - 1, data, item, maxHpRef);
                            } else if (e.key === "Enter") {
                                const value = Number(e.currentTarget.value.replace(/[^0-9]/g, ""));
                                changeMaxHp(value, data, item, maxHpRef);
                            }
                        }}
                        onBlur={(e) => {
                            const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                            changeMaxHp(value, data, item, maxHpRef);
                        }}
                    />
                </Tippy>
            </div>
            <div className={"bottom-row"}>
                <Tippy content={"set temp HP"}>
                    <input
                        type={"text"}
                        defaultValue={data.stats.tempHp}
                        ref={tempHpRef}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                                changeTempHp((data.stats.tempHp || 0) + 1, data, item, hpRef, tempHpRef);
                            } else if (e.key === "ArrowDown") {
                                changeTempHp((data.stats.tempHp || 0) - 1, data, item, hpRef, tempHpRef);
                            } else if (e.key === "Enter") {
                                const value = Number(e.currentTarget.value.replace(/[^0-9]/g, ""));
                                changeTempHp(value, data, item, hpRef, tempHpRef);
                            }
                        }}
                        onBlur={(e) => {
                            const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                            changeTempHp(value, data, item, hpRef, tempHpRef);
                        }}
                    />
                </Tippy>
                {playerContext.role === "GM" ? (
                    <MapButton
                        onClick={async () => {
                            const b = !data.hpOnMap;
                            const newData = { ...data, hpOnMap: b, hpBar: b && !room?.disableHpBar };
                            updateTokenMetadata(newData, [id]);
                            return updateHp(item, newData);
                        }}
                        onContextMenu={async () => {
                            const newData = {
                                ...data,
                                playerMap: { ac: !!data.playerMap?.ac, hp: !data.playerMap?.hp },
                            };
                            updateTokenMetadata(newData, [id]);
                            return updateHp(item, newData);
                        }}
                        active={data.hpOnMap}
                        players={!!data.playerMap?.hp}
                        tooltip={"Show HP on map (right click for players)"}
                    />
                ) : null}
            </div>
        </div>
    );
};
