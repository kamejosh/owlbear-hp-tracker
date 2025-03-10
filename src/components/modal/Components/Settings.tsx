import { diceTrayModal, diceTrayModalId, itemMetadataKey, modalId } from "../../../helper/variables.ts";
import OBR from "@owlbear-rodeo/sdk";
import { updateHp, updateHpOffset } from "../../../helper/hpHelpers.ts";
import { Groups } from "./Groups.tsx";
import { Switch } from "../../general/Switch/Switch.tsx";
import { dndSvg, pfSvg } from "./SwitchBackground.ts";
import { updateAcOffset } from "../../../helper/acHelper.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { getRoomDiceUser, updateRoomMetadata } from "../../../helper/helpers.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { useShallow } from "zustand/react/shallow";
import { updateList } from "../../../helper/obrHelper.ts";
import { GMGMetadata } from "../../../helper/types.ts";

export const Settings = () => {
    const tokens = useTokenListContext(useShallow((state) => state.tokens));
    const [room, scene] = useMetadataContext(useShallow((state) => [state.room, state.scene]));

    const handleOffsetChange = (value: number) => {
        updateHpOffset(value);
        updateRoomMetadata(room, { hpBarOffset: value });
    };

    const handleAcOffsetChange = (x: number, y: number) => {
        updateAcOffset({ x: x, y: y });
        updateRoomMetadata(room, { acOffset: { x: x, y: y } });
    };

    return (
        <>
            <button className={"close-button"} onClick={async () => await OBR.modal.close(modalId)}>
                X
            </button>
            <div className={"global-setting"}>
                <h2>Settings</h2>
                <>
                    <div className={"settings-context vertical"}>
                        <h3>Room Settings</h3>
                        <span className={"small"}>(Shared across all scenes in opened in the current Room)</span>
                    </div>
                    <div className={"ruleset setting"}>
                        Statblock Game Rules:{" "}
                        <Switch
                            labels={{ left: "DnD", right: "PF" }}
                            onChange={(checked) => {
                                if (checked) {
                                    updateRoomMetadata(room, { ruleset: "pf" });
                                } else {
                                    updateRoomMetadata(room, { ruleset: "e5" });
                                }
                            }}
                            checked={!!room && room.ruleset === "pf"}
                            backgroundImages={{ left: dndSvg, right: pfSvg }}
                        />
                    </div>
                    <div className={"tabletop-almanac setting"}>
                        Tabletop Almanac API Key:
                        <input
                            type={"password"}
                            value={room?.tabletopAlmanacAPIKey || ""}
                            onChange={(e) => {
                                updateRoomMetadata(room, { tabletopAlmanacAPIKey: e.currentTarget.value });
                            }}
                        />
                    </div>
                    <div className={"hp-mode setting-group vertical"}>
                        <div>
                            HP Bar Segments:{" "}
                            <input
                                type={"text"}
                                size={2}
                                value={room?.hpBarSegments || 0}
                                onChange={(e) => {
                                    const nValue = Number(e.target.value.replace(/[^0-9]/g, ""));
                                    updateRoomMetadata(room, { hpBarSegments: nValue });
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowUp") {
                                        updateRoomMetadata(room, { hpBarSegments: (room?.hpBarSegments || 0) + 1 });
                                    } else if (e.key === "ArrowDown") {
                                        updateRoomMetadata(room, { hpBarSegments: (room?.hpBarSegments || 0) + -1 });
                                    }
                                }}
                            />
                        </div>
                        <div>
                            Disable HP Bar:
                            <input
                                type={"checkbox"}
                                checked={!!room?.disableHpBar}
                                onChange={async () => {
                                    const hpBarDisabled = !room?.disableHpBar;
                                    await updateRoomMetadata(room, {
                                        disableHpBar: hpBarDisabled,
                                    });
                                    const items = tokens ? [...tokens].map((t) => t[1].item) : [];
                                    await updateList(items, hpBarDisabled ? 4 : 2, async (subList) => {
                                        for (const item of subList) {
                                            const data = item.metadata[itemMetadataKey] as GMGMetadata;
                                            await updateHp(item, {
                                                ...data,
                                                hpBar: data.hpOnMap && !hpBarDisabled,
                                            });
                                        }
                                    });
                                }}
                            />
                        </div>
                        <div>
                            Disable Color Gradient For Players:
                            <input
                                type={"checkbox"}
                                checked={!!room?.disableColorGradient}
                                onChange={async () => {
                                    await updateRoomMetadata(room, {
                                        disableColorGradient: !room?.disableColorGradient,
                                    });
                                }}
                            />
                        </div>
                    </div>
                    <div className={"setting-group vertical"}>
                        <div className={"hp-position setting"}>
                            Text and Bar Offset:{" "}
                            <input
                                type={"number"}
                                size={2}
                                defaultValue={room?.hpBarOffset || 0}
                                onChange={(e) => {
                                    handleOffsetChange(Number(e.currentTarget.value));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowUp") {
                                        handleOffsetChange((room?.hpBarOffset || 0) + 1);
                                        e.currentTarget.value = String((room?.hpBarOffset || 0) + 1);
                                    } else if (e.key === "ArrowDown") {
                                        handleOffsetChange((room?.hpBarOffset || 0) - 1);
                                        e.currentTarget.value = String((room?.hpBarOffset || 0) + 1);
                                    }
                                }}
                            />
                        </div>
                        <div className={"ac setting"}>
                            AC Offset:
                            <div>
                                X{" "}
                                <input
                                    type={"number"}
                                    size={2}
                                    value={room?.acOffset?.x || 0}
                                    onChange={(e) => {
                                        handleAcOffsetChange(Number(e.currentTarget.value), room?.acOffset?.y || 0);
                                    }}
                                />
                                Y{" "}
                                <input
                                    type={"number"}
                                    size={2}
                                    value={room?.acOffset?.y || 0}
                                    onChange={(e) => {
                                        handleAcOffsetChange(room?.acOffset?.x || 0, Number(e.currentTarget.value));
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className={"dice-roller-enabled setting"}>
                        Use calculated rolls (no 3D dice):
                        <input
                            type={"checkbox"}
                            checked={room?.disableDiceRoller || false}
                            onChange={async () => {
                                const disableDiceRoller = !room?.disableDiceRoller;
                                await updateRoomMetadata(room, { disableDiceRoller: disableDiceRoller });
                                if (!disableDiceRoller) {
                                    const diceRoomUser = getRoomDiceUser(room, OBR.player.id);
                                    if (diceRoomUser) {
                                        await OBR.modal.open({
                                            ...diceTrayModal,
                                            url: `https://dddice.com/room/${room.diceRoom!.slug}/stream?key=${
                                                diceRoomUser.apiKey
                                            }`,
                                        });
                                    }
                                } else {
                                    await OBR.modal.close(diceTrayModalId);
                                }
                            }}
                        />
                    </div>
                    <div className={"negative-numbers setting"}>
                        Allow negative HP/AC:
                        <input
                            type={"checkbox"}
                            checked={room?.allowNegativeNumbers || false}
                            onChange={() => {
                                updateRoomMetadata(room, { allowNegativeNumbers: !room?.allowNegativeNumbers });
                            }}
                        />
                    </div>
                    <div className={"player-sort setting"}>
                        Sort Tokens by Initiative for Players:
                        <input
                            type={"checkbox"}
                            checked={room?.playerSort || false}
                            onChange={() => {
                                updateRoomMetadata(room, { playerSort: !room?.playerSort });
                            }}
                        />
                    </div>
                    <div className={"initiative-dice setting"}>
                        Set Initiative Dice:
                        <input
                            type={"number"}
                            size={1}
                            value={room?.initiativeDice || 20}
                            onChange={(e) => {
                                updateRoomMetadata(room, { initiativeDice: parseInt(e.target.value) });
                            }}
                        />
                    </div>
                    <div className={"statblock-popover setting-group vertical"}>
                        <div className={"settings-context vertical"}>
                            <h4>Statblock Popover dimensions</h4>
                            <span className={"small"}>(bigger than the current viewport is not possible)</span>
                        </div>
                        <label>
                            width{" "}
                            <input
                                type={"number"}
                                defaultValue={room?.statblockPopover?.width || 500}
                                onBlur={(e) => {
                                    updateRoomMetadata(room, {
                                        statblockPopover: {
                                            height: room?.statblockPopover?.height || 600,
                                            width: Math.max(parseInt(e.currentTarget.value), 200),
                                        },
                                    });

                                    e.currentTarget.value = String(Math.max(200, parseInt(e.currentTarget.value)));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        updateRoomMetadata(room, {
                                            statblockPopover: {
                                                height: room?.statblockPopover?.height || 600,
                                                width: Math.max(parseInt(e.currentTarget.value), 200),
                                            },
                                        });
                                        e.currentTarget.value = String(Math.max(200, parseInt(e.currentTarget.value)));
                                    }
                                }}
                            />
                        </label>
                        <label>
                            height{" "}
                            <input
                                type={"number"}
                                defaultValue={room?.statblockPopover?.height || 600}
                                onBlur={(e) => {
                                    updateRoomMetadata(room, {
                                        statblockPopover: {
                                            width: room?.statblockPopover?.width || 500,
                                            height: Math.max(parseInt(e.currentTarget.value), 200),
                                        },
                                    });
                                    e.currentTarget.value = String(Math.max(200, parseInt(e.target.value)));
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        updateRoomMetadata(room, {
                                            statblockPopover: {
                                                width: room?.statblockPopover?.width || 500,
                                                height: Math.max(parseInt(e.currentTarget.value), 200),
                                            },
                                        });
                                        e.currentTarget.value = String(Math.max(200, parseInt(e.currentTarget.value)));
                                    }
                                }}
                            />
                        </label>
                    </div>
                    <div className={"update-notification setting"}>
                        Don't show Changelog on updates:
                        <input
                            type={"checkbox"}
                            checked={room?.ignoreUpdateNotification || false}
                            onChange={() => {
                                updateRoomMetadata(room, { ignoreUpdateNotification: !room?.ignoreUpdateNotification });
                            }}
                        />
                    </div>
                    <div className={"settings-context vertical"}>
                        <h3>Scene Settings</h3>
                        <span className={"small"}>(Settings only affect the current Scene)</span>
                    </div>
                    {scene ? (
                        <Groups />
                    ) : (
                        <span className={"warning"}>Scene Settings only available once Scene is open</span>
                    )}
                </>
            </div>
        </>
    );
};
