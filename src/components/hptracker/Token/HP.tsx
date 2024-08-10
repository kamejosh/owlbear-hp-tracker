import { changeHp, changeMaxHp, changeTempHp, getNewHpValue } from "../../../helper/tokenHelper.ts";
import { useEffect, useRef } from "react";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import _ from "lodash";

export const HP = ({ id }: { id: string }) => {
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
        <>
            <div className={"current-hp"}>
                <input
                    ref={hpRef}
                    type={"text"}
                    size={3}
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
                <span>/</span>
                <input
                    type={"text"}
                    size={3}
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
            </div>
            <div className={"temp-hp"}>
                <input
                    type={"text"}
                    size={1}
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
            </div>
        </>
    );
};
