import { getNewHpFieldValues, HpFields, updateHpFields, updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useEffect, useState } from "react";
import { GMGMetadata } from "../../../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import _, { isEqual, isNaN } from "lodash";
import { HPSvg } from "../../svgs/HPSvg.tsx";
import "./hp.scss";
import { MapButton } from "./MapButton.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { updateHp } from "../../../helper/hpHelpers.ts";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { useDebounce } from "ahooks";

export const HP = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const room = useMetadataContext(useShallow((state) => state.room));
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;
    const [hpFields, setHpFields] = useState<HpFields & { persist: boolean }>({
        hp: data.hp.toString(),
        maxHp: data.maxHp.toString(),
        tempHp: (data.stats.tempHp ?? 0).toString(),
        persist: true,
    });
    const debouncedHpFields = useDebounce(hpFields, { wait: 500 });

    useEffect(() => {
        if (
            data.hp !== Number(hpFields.hp) ||
            data.maxHp !== Number(hpFields.maxHp) ||
            data.stats.tempHp !== Number(hpFields.tempHp)
        ) {
            setHpFields({
                hp: data.hp.toString(),
                maxHp: data.maxHp.toString(),
                tempHp: (data.stats.tempHp ?? 0).toString(),
                persist: false,
            });
        }
    }, [data.hp, data.maxHp, data.stats.tempHp]);

    useEffect(() => {
        const hp = Number(debouncedHpFields.hp);
        const maxHp = Number(debouncedHpFields.maxHp);
        const tempHp = Number(debouncedHpFields.tempHp);
        if (debouncedHpFields.persist) {
            if (isNaN(hp) || isNaN(maxHp) || isNaN(tempHp)) {
                return;
            }
            if (hp !== data.hp || maxHp !== data.maxHp || tempHp !== (data.stats.tempHp ?? 0)) {
                updateHpFields(debouncedHpFields, data, item);
            }
        }
    }, [debouncedHpFields]);

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
                        type={"text"}
                        value={hpFields.hp}
                        onChange={(e) => {
                            setHpFields({ ...hpFields, hp: e.currentTarget.value, persist: false });
                        }}
                        onBlur={(e) => {
                            const newHpFields = getNewHpFieldValues("hp", data, undefined, e.currentTarget.value, room);
                            if (!isEqual(newHpFields, hpFields)) {
                                setHpFields({ ...newHpFields, persist: true });
                            }
                        }}
                        onKeyDown={async (e) => {
                            if (e.key === "ArrowUp") {
                                const newHpFields = getNewHpFieldValues(
                                    "hp",
                                    data,
                                    Number(hpFields.hp) + 1,
                                    undefined,
                                    room,
                                );
                                if (!isEqual(newHpFields, hpFields)) {
                                    setHpFields({ ...newHpFields, persist: true });
                                }
                            } else if (e.key === "ArrowDown") {
                                const newHpFields = getNewHpFieldValues(
                                    "hp",
                                    data,
                                    Number(hpFields.hp) - 1,
                                    undefined,
                                    room,
                                );
                                if (!isEqual(newHpFields, hpFields)) {
                                    setHpFields({ ...newHpFields, persist: true });
                                }
                            } else if (e.key === "Enter") {
                                const newHpFields = getNewHpFieldValues(
                                    "hp",
                                    data,
                                    undefined,
                                    e.currentTarget.value,
                                    room,
                                );
                                if (!isEqual(newHpFields, hpFields)) {
                                    setHpFields({ ...newHpFields, persist: true });
                                }
                            }
                        }}
                    />
                </Tippy>
                <span className={"divider"}></span>
                <Tippy content={"Set max HP"}>
                    <input
                        type={"text"}
                        value={hpFields.maxHp}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                                const newHpFields = getNewHpFieldValues(
                                    "maxHp",
                                    data,
                                    Number(hpFields.maxHp) + 1,
                                    undefined,
                                    room,
                                );
                                if (!isEqual(newHpFields, hpFields)) {
                                    setHpFields({ ...newHpFields, persist: true });
                                }
                            } else if (e.key === "ArrowDown") {
                                const newHpFields = getNewHpFieldValues(
                                    "maxHp",
                                    data,
                                    Number(hpFields.maxHp) - 1,
                                    undefined,
                                    room,
                                );
                                if (!isEqual(newHpFields, hpFields)) {
                                    setHpFields({ ...newHpFields, persist: true });
                                }
                            } else if (e.key === "Enter") {
                                const newHpFields = getNewHpFieldValues(
                                    "maxHp",
                                    data,
                                    undefined,
                                    e.currentTarget.value,
                                    room,
                                );
                                if (!isEqual(newHpFields, hpFields)) {
                                    setHpFields({ ...newHpFields, persist: true });
                                }
                            }
                        }}
                        onBlur={(e) => {
                            const newHpFields = getNewHpFieldValues(
                                "maxHp",
                                data,
                                undefined,
                                e.currentTarget.value,
                                room,
                            );
                            if (!isEqual(newHpFields, hpFields)) {
                                setHpFields({ ...newHpFields, persist: true });
                            }
                        }}
                        onChange={(e) => {
                            setHpFields({ ...hpFields, maxHp: e.currentTarget.value, persist: false });
                        }}
                    />
                </Tippy>
            </div>
            <div className={"bottom-row"}>
                <Tippy content={"set temp HP"}>
                    <input
                        type={"text"}
                        value={hpFields.tempHp}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                                const newHpFields = getNewHpFieldValues(
                                    "tempHp",
                                    data,
                                    Number(hpFields.tempHp) + 1,
                                    undefined,
                                    room,
                                );
                                if (!isEqual(newHpFields, hpFields)) {
                                    setHpFields({ ...newHpFields, persist: true });
                                }
                            } else if (e.key === "ArrowDown") {
                                const newHpFields = getNewHpFieldValues(
                                    "tempHp",
                                    data,
                                    Number(hpFields.tempHp) - 1,
                                    undefined,
                                    room,
                                );
                                if (!isEqual(newHpFields, hpFields)) {
                                    setHpFields({ ...newHpFields, persist: true });
                                }
                            } else if (e.key === "Enter") {
                                const newHpFields = getNewHpFieldValues(
                                    "tempHp",
                                    data,
                                    undefined,
                                    e.currentTarget.value,
                                    room,
                                );
                                if (!isEqual(newHpFields, hpFields)) {
                                    setHpFields({ ...newHpFields, persist: true });
                                }
                            }
                        }}
                        onChange={async (e) => {
                            setHpFields({ ...hpFields, tempHp: e.currentTarget.value, persist: false });
                        }}
                        onBlur={(e) => {
                            const newHpFields = getNewHpFieldValues(
                                "tempHp",
                                data,
                                undefined,
                                e.currentTarget.value,
                                room,
                            );
                            if (!isEqual(newHpFields, hpFields)) {
                                setHpFields({ ...newHpFields, persist: true });
                            }
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
