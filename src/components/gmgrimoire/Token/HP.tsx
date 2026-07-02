import { getNewHpFieldValues, HpFields, updateHpFields, updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useEffect, useRef, useState } from "react";
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
import { useE5GetStatblock } from "../../../api/e5/useE5Api.ts";
import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import { ContextPopover } from "../../general/ContextPopover.tsx";
import { replaceStatWithMod } from "../../../helper/limitHelpers.ts";
import { cleanStats } from "../../../helper/equipmentHelpers.ts";
import { Loader } from "../../general/Loader.tsx";

export const RollMaxHp = ({
    id,
    hpFields,
    setHpFields,
    setContextEvent,
}: {
    id: string;
    hpFields: HpFields;
    setHpFields: (hpFields: HpFields & { persist: boolean }) => void;
    setContextEvent: (contextEvent: MouseEvent | null) => void;
}) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMGMetadata;
    const room = useMetadataContext(useShallow((state) => state.room));

    const ruleset = data.ruleset ?? room?.ruleset;
    const statblockQuery = useE5GetStatblock(ruleset === "e5" ? data.sheet : "", room?.tabletopAlmanacAPIKey);
    const statblock = statblockQuery.isSuccess ? statblockQuery.data : null;
    const hitDice = statblock
        ? replaceStatWithMod(
              statblock.hp?.hit_dice ?? "",
              cleanStats(statblock.stats),
              statblock.skills,
              statblock.proficiency_bonus ?? 0,
          )
        : "";

    const rollHitDice = () => {
        if (hitDice) {
            try {
                const roll = new DiceRoll(hitDice);
                const newHpFields = getNewHpFieldValues("maxHp", data, roll.total, undefined, room);
                if (!isEqual(newHpFields, hpFields)) {
                    setHpFields({
                        ...newHpFields,
                        hp: newHpFields.maxHp,
                        persist: true,
                    });
                }
            } catch (e) {
                console.error("Failed to roll hit dice", e);
            }
        }
    };

    if (statblockQuery.isLoading) {
        return <Loader />;
    }

    return (
        <div className={"hp-context-menu"}>
            <div
                className={"hp-context-menu-item"}
                onClick={() => {
                    rollHitDice();
                    setContextEvent(null);
                }}
            >
                Roll Max HP ({hitDice})
            </div>
        </div>
    );
};

export const HP = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const room = useMetadataContext(useShallow((state) => state.room));
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;
    const [contextEvent, setContextEvent] = useState<MouseEvent | null>(null);

    const [hpFields, setHpFields] = useState<HpFields & { persist: boolean }>({
        hp: data.hp.toString(),
        maxHp: data.maxHp.toString(),
        tempHp: (data.stats.tempHp ?? 0).toString(),
        persist: true,
    });

    const prevDataRef = useRef({
        hp: data.hp,
        maxHp: data.maxHp,
        tempHp: data.stats.tempHp,
    });

    const debouncedHpFields = useDebounce(hpFields, { wait: 500 });

    useEffect(() => {
        setHpFields((prev) => {
            let changed = false;
            const nextFields = { ...prev };

            if (data.hp !== prevDataRef.current.hp) {
                nextFields.hp = data.hp.toString();
                changed = true;
            }
            if (data.maxHp !== prevDataRef.current.maxHp) {
                nextFields.maxHp = data.maxHp.toString();
                changed = true;
            }
            if (data.stats.tempHp !== prevDataRef.current.tempHp) {
                nextFields.tempHp = (data.stats.tempHp ?? 0).toString();
                changed = true;
            }

            prevDataRef.current = {
                hp: data.hp,
                maxHp: data.maxHp,
                tempHp: data.stats.tempHp,
            };

            if (changed) {
                return { ...nextFields, persist: false };
            }
            return prev;
        });
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
                void updateHpFields(debouncedHpFields, data, item);
            }
        }
    }, [debouncedHpFields]);

    // This helper fixes the stale data bug and removes duplicate JSX code
    const handleFieldUpdate = (field: "hp" | "maxHp" | "tempHp", numValue?: number, stringValue?: string) => {
        setHpFields((prev) => {
            // Merge external 'data' with the absolute latest local typing
            const mergedData = {
                ...data,
                hp: isNaN(Number(prev.hp)) ? data.hp : Number(prev.hp),
                maxHp: isNaN(Number(prev.maxHp)) ? data.maxHp : Number(prev.maxHp),
                stats: {
                    ...data.stats,
                    tempHp: data.stats.tempHp ?? 0,
                },
            };

            const newHpFields = getNewHpFieldValues(field, mergedData, numValue, stringValue, room);

            if (!isEqual(newHpFields, prev)) {
                return { ...newHpFields, persist: true };
            }
            return prev;
        });
    };

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
                            // Using functional state updates here prevents dropped keystrokes
                            const val = e.currentTarget.value;
                            setHpFields((prev) => ({ ...prev, hp: val, persist: false }));
                        }}
                        onBlur={(e) => handleFieldUpdate("hp", undefined, e.currentTarget.value)}
                        onKeyDown={async (e) => {
                            if (e.key === "ArrowUp") {
                                handleFieldUpdate("hp", Number(hpFields.hp) + 1);
                            } else if (e.key === "ArrowDown") {
                                handleFieldUpdate("hp", Number(hpFields.hp) - 1);
                            } else if (e.key === "Enter") {
                                handleFieldUpdate("hp", undefined, e.currentTarget.value);
                            }
                        }}
                    />
                </Tippy>
                <span className={"divider"}></span>
                <ContextPopover context={contextEvent}>
                    <RollMaxHp
                        id={id}
                        hpFields={hpFields}
                        setHpFields={setHpFields}
                        setContextEvent={setContextEvent}
                    />
                </ContextPopover>
                <Tippy content={"Set max HP"}>
                    <input
                        type={"text"}
                        value={hpFields.maxHp}
                        onContextMenu={(e) => {
                            if (data.sheet) {
                                e.preventDefault();
                                setContextEvent(e.nativeEvent);
                            }
                        }}
                        onChange={(e) => {
                            const val = e.currentTarget.value;
                            setHpFields((prev) => ({ ...prev, maxHp: val, persist: false }));
                        }}
                        onBlur={(e) => handleFieldUpdate("maxHp", undefined, e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                                handleFieldUpdate("maxHp", Number(hpFields.maxHp) + 1);
                            } else if (e.key === "ArrowDown") {
                                handleFieldUpdate("maxHp", Number(hpFields.maxHp) - 1);
                            } else if (e.key === "Enter") {
                                handleFieldUpdate("maxHp", undefined, e.currentTarget.value);
                            }
                        }}
                    />
                </Tippy>
            </div>
            <div className={"bottom-row"}>
                <Tippy content={"set temp HP"}>
                    <input
                        type={"text"}
                        value={hpFields.tempHp}
                        onChange={(e) => {
                            const val = e.currentTarget.value;
                            setHpFields((prev) => ({ ...prev, tempHp: val, persist: false }));
                        }}
                        onBlur={(e) => handleFieldUpdate("tempHp", undefined, e.currentTarget.value)}
                        onKeyDown={(e) => {
                            if (e.key === "ArrowUp") {
                                handleFieldUpdate("tempHp", Number(hpFields.tempHp) + 1);
                            } else if (e.key === "ArrowDown") {
                                handleFieldUpdate("tempHp", Number(hpFields.tempHp) - 1);
                            } else if (e.key === "Enter") {
                                handleFieldUpdate("tempHp", undefined, e.currentTarget.value);
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
