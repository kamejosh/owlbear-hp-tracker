import { diceTrayModal, diceTrayModalId, modalId } from "../../../helper/variables.ts";
import OBR from "@owlbear-rodeo/sdk";
import { updateHpOffset } from "../../../helper/hpHelpers.ts";
import { Groups } from "./Groups.tsx";
import { Switch } from "../../general/Switch/Switch.tsx";
import { dndSvg, pfSvg } from "./SwitchBackground.ts";
import { updateAcOffset } from "../../../helper/acHelper.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateRoomMetadata } from "../../../helper/helpers.ts";

export const Settings = () => {
    const { room } = useMetadataContext();

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
                    <div className={"settings-context"}>
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
                    <div className={"hp-mode setting"}>
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
                    <div className={"hp-position setting"}>
                        Text and Bar Offset:{" "}
                        <input
                            type={"text"}
                            size={2}
                            defaultValue={room?.hpBarOffset || 0}
                            onChange={(e) => {
                                const factor = e.target.value.startsWith("-") ? -1 : 1;
                                const nValue = Number(e.target.value.replace(/[^0-9]/g, ""));
                                handleOffsetChange(nValue * factor);
                                if (factor < 0 && nValue === 0) {
                                    e.currentTarget.value = "-";
                                } else {
                                    e.currentTarget.value = (nValue * factor).toString();
                                }
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "ArrowUp") {
                                    handleOffsetChange((room?.hpBarOffset || 0) + 1);
                                    e.currentTarget.value = ((room?.hpBarOffset || 0) + 1).toString();
                                } else if (e.key === "ArrowDown") {
                                    handleOffsetChange((room?.hpBarOffset || 0) - 1);
                                    e.currentTarget.value = ((room?.hpBarOffset || 0) + 1).toString();
                                }
                            }}
                        />
                    </div>
                    <div className={"ac setting"}>
                        <div className={"ac-position"}>
                            AC Offset: X{" "}
                            <input
                                type={"text"}
                                size={2}
                                value={room?.acOffset?.x || 0}
                                onChange={(e) => {
                                    const factor = e.target.value.startsWith("-") ? -1 : 1;
                                    const nValue = Number(e.target.value.replace(/[^0-9]/g, ""));
                                    handleAcOffsetChange(nValue * factor, room?.acOffset?.y || 0);
                                }}
                            />
                            Y{" "}
                            <input
                                type={"text"}
                                size={2}
                                value={room?.acOffset?.y || 0}
                                onChange={(e) => {
                                    const factor = e.target.value.startsWith("-") ? -1 : 1;
                                    const nValue = Number(e.target.value.replace(/[^0-9]/g, ""));
                                    handleAcOffsetChange(room?.acOffset?.x || 0, nValue * factor);
                                }}
                            />
                        </div>
                    </div>
                    <div className={"dice-roller-enabled setting"}>
                        Disable Dice Roller:
                        <input
                            type={"checkbox"}
                            checked={room?.disableDiceRoller || false}
                            onChange={async () => {
                                const disableDiceRoller = !room?.disableDiceRoller;
                                await updateRoomMetadata(room, { disableDiceRoller: disableDiceRoller });
                                if (!disableDiceRoller) {
                                    await OBR.modal.open(diceTrayModal);
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
                        Sort Tokens in Player View:
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
                    <div className={"statblock-popover setting"}>
                        Statblock Popover dimensions{" "}
                        <span className={"small"}>(bigger than the current viewport is not possible)</span>
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

                                    e.currentTarget.value = Math.max(200, parseInt(e.currentTarget.value)).toString();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        updateRoomMetadata(room, {
                                            statblockPopover: {
                                                height: room?.statblockPopover?.height || 600,
                                                width: Math.max(parseInt(e.currentTarget.value), 200),
                                            },
                                        });
                                        e.currentTarget.value = Math.max(
                                            200,
                                            parseInt(e.currentTarget.value)
                                        ).toString();
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
                                    e.currentTarget.value = Math.max(200, parseInt(e.target.value)).toString();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        updateRoomMetadata(room, {
                                            statblockPopover: {
                                                width: room?.statblockPopover?.width || 500,
                                                height: Math.max(parseInt(e.currentTarget.value), 200),
                                            },
                                        });
                                        e.currentTarget.value = Math.max(
                                            200,
                                            parseInt(e.currentTarget.value)
                                        ).toString();
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
                    <div className={"settings-context"}>
                        <h3>Scene Settings</h3>
                        <span className={"small"}>(Settings only affect the current Scene)</span>
                    </div>
                    <Groups />
                </>
            </div>
        </>
    );
};
