import {
    changeHp,
    changeMaxHp,
    changeTempHp,
    getNewHpValue,
    getNewTempHp,
    updateTokenMetadata,
} from "../../../helper/tokenHelper.ts";
import { useEffect, useRef } from "react";
import { GMGMetadata } from "../../../helper/types.ts";
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
import { useShallow } from "zustand/react/shallow";

export const HP = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const hpRef = useRef<HTMLInputElement>(null);
    const maxHpRef = useRef<HTMLInputElement>(null);
    const tempHpRef = useRef<HTMLInputElement>(null);
    const room = useMetadataContext(useShallow((state) => state.room));
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMGMetadata;
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
            <HPSvg
                percent={data.stats.tempHp && data.stats.tempHp > 0 ? 100 : 0}
                name={`tempHp-${item.id}`}
                className={"temp-hp-icon"}
                color={"#2248ff"}
            />
            <div className={"current-hp"}>
                <Tippy content={"Set current HP"}>
                    <input
                        ref={hpRef}
                        type={"text"}
                        defaultValue={data.hp}
                        onBlur={async (e) => {
                            const input = e.target.value;
                            const hp = await getNewHpValue(input, data, item, maxHpRef, room);
                            if (hp !== null) {
                                e.target.value = String(hp);
                                await changeHp(hp, data, item, hpRef, tempHpRef, room);
                            }
                        }}
                        onKeyDown={async (e) => {
                            if (e.key === "ArrowUp") {
                                const hp = Math.min(
                                    data.hp + 1,
                                    data.stats.tempHp ? data.maxHp + data.stats.tempHp : data.maxHp,
                                );
                                await changeHp(hp, data, item, hpRef, tempHpRef, room);
                                e.currentTarget.value = String(hp);
                            } else if (e.key === "ArrowDown") {
                                const hp = Math.min(
                                    data.hp - 1,
                                    data.stats.tempHp ? data.maxHp + data.stats.tempHp : data.maxHp,
                                );
                                await changeHp(hp, data, item, hpRef, tempHpRef, room);
                                e.currentTarget.value = String(hp);
                            } else if (e.key === "Enter") {
                                const input = e.currentTarget.value;
                                const hp = await getNewHpValue(input, data, item, maxHpRef, room);
                                if (hp !== null) {
                                    await changeHp(hp, data, item, hpRef, tempHpRef, room);
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
                        onKeyDown={async (e) => {
                            if (e.key === "ArrowUp") {
                                await changeMaxHp(data.maxHp + 1, data, item, maxHpRef);
                            } else if (e.key === "ArrowDown") {
                                await changeMaxHp(data.maxHp - 1, data, item, maxHpRef);
                            } else if (e.key === "Enter") {
                                const value = Number(e.currentTarget.value.replace(/[^0-9]/g, ""));
                                await changeMaxHp(value, data, item, maxHpRef);
                            }
                        }}
                        onBlur={async (e) => {
                            const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                            await changeMaxHp(value, data, item, maxHpRef);
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
                        onKeyDown={async (e) => {
                            if (e.key === "ArrowUp") {
                                await changeTempHp((data.stats.tempHp || 0) + 1, data, item, hpRef, tempHpRef);
                            } else if (e.key === "ArrowDown") {
                                await changeTempHp((data.stats.tempHp || 0) - 1, data, item, hpRef, tempHpRef);
                            } else if (e.key === "Enter") {
                                const value = getNewTempHp(e.currentTarget.value);
                                await changeTempHp(value, data, item, hpRef, tempHpRef);
                            }
                        }}
                        onBlur={async (e) => {
                            const value = getNewTempHp(e.currentTarget.value);
                            await changeTempHp(value, data, item, hpRef, tempHpRef);
                        }}
                    />
                </Tippy>
                {playerContext.role === "GM" ? (
                    <MapButton
                        onClick={async () => {
                            const b = !data.hpOnMap;
                            const newData = { ...data, hpOnMap: b, hpBar: b && !room?.disableHpBar };
                            await updateTokenMetadata(newData, [id]);
                            await updateHp(item, newData);
                        }}
                        onContextMenu={async () => {
                            const newData = {
                                ...data,
                                playerMap: { ac: !!data.playerMap?.ac, hp: !data.playerMap?.hp },
                            };
                            await updateTokenMetadata(newData, [id]);
                            await updateHp(item, newData);
                        }}
                        active={data.hpOnMap}
                        players={!!data.playerMap?.hp}
                        tooltip={"Add HP to map (players: right click)"}
                    />
                ) : null}
            </div>
        </div>
    );
};
