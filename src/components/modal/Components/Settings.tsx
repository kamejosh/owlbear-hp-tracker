import { useLocalStorage } from "../../../helper/hooks.ts";
import { ID, modalId, sceneMetadata } from "../../../helper/variables.ts";
import { Ruleset, SceneMetadata } from "../../../helper/types.ts";
import { SceneReadyContext } from "../../../context/SceneReadyContext.ts";
import { useEffect, useState } from "react";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { updateHpOffset } from "../../../helper/hpHelpers.ts";
import { Groups } from "./Groups.tsx";
import { Switch } from "../../general/Switch/Switch.tsx";
import { dndSvg, pfSvg } from "./SwitchBackground.ts";
import { plausibleEvent } from "../../../helper/helpers.ts";
import { updateAcOffset } from "../../../helper/acHelper.ts";

export const Settings = () => {
    const [offset, setOffset] = useLocalStorage<number>(`${ID}.offset`, 0);
    const [acOffset, setAcOffset] = useLocalStorage<{ x: number; y: number }>(`${ID}.acOffset`, { x: 0, y: 0 });
    // const [acShield, setAcShield] = useLocalStorage<boolean>(`${ID}.acShield`, true);
    const [segments, setSegments] = useLocalStorage<number>(`${ID}.hpSegments`, 0);
    const [allowNegativNumbers, setAllowNegativeNumbers] = useLocalStorage<boolean>(
        `${ID}.allowNegativeNumbers`,
        false
    );
    const [ruleset, setStateRuleset] = useLocalStorage<Ruleset>(`${ID}.ruleset`, "e5");
    const [initiativeDice, setInitiativeDice] = useLocalStorage<number>(`${ID}.initiativeDice`, 20);
    const [statblockPopover, setStatblockPopover] = useLocalStorage<{ width: number; height: number }>(
        `${ID}.statblockPopover`,
        { width: 500, height: 600 }
    );
    const [playerSort, setPlayerSort] = useLocalStorage<boolean>(`${ID}.playerSort`, false);
    const { isReady } = SceneReadyContext();
    const [sceneId, setSceneId] = useState<string | null>(null);

    useEffect(() => {
        const setSceneMetadata = async () => {
            const metadata: Metadata = await OBR.scene.getMetadata();
            // We use version and id from the saved metadata, no need to refresh this
            const hpTrackerSceneMetadata = metadata[sceneMetadata] as SceneMetadata;
            hpTrackerSceneMetadata.hpBarOffset = offset;
            hpTrackerSceneMetadata.acOffset = acOffset;
            // hpTrackerSceneMetadata.acShield = acShield;
            hpTrackerSceneMetadata.hpBarSegments = segments;
            hpTrackerSceneMetadata.allowNegativeNumbers = allowNegativNumbers;
            hpTrackerSceneMetadata.ruleset = ruleset;
            hpTrackerSceneMetadata.initiativeDice = initiativeDice;
            hpTrackerSceneMetadata.statblockPopover = statblockPopover;
            hpTrackerSceneMetadata.playerSort = playerSort;
            const ownMetadata: Metadata = {};
            ownMetadata[sceneMetadata] = hpTrackerSceneMetadata;

            await OBR.scene.setMetadata(ownMetadata);
        };
        if (isReady) {
            setSceneMetadata();
        }
    }, [offset, segments, allowNegativNumbers, ruleset, acOffset, statblockPopover, playerSort, initiativeDice]);

    const handleOffsetChange = (value: number) => {
        updateHpOffset(value);
        setOffset(value);
    };

    const handleAcOffsetChange = (x: number, y: number) => {
        updateAcOffset({ x: x, y: y });
        setAcOffset({ x: x, y: y });
    };

    const initSettings = async () => {
        const sceneData = await OBR.scene.getMetadata();
        setSceneId((sceneData[sceneMetadata] as SceneMetadata).id);
    };

    useEffect(() => {
        if (isReady) {
            initSettings();
        }
    }, [isReady]);

    return (
        <>
            <button className={"close-button"} onClick={async () => await OBR.modal.close(modalId)}>
                X
            </button>
            <div className={"global-setting"}>
                <h3>Global Settings</h3>
                <>
                    <div className={"ruleset setting"}>
                        Statblock Game Rules:{" "}
                        <Switch
                            labels={{ left: "DnD", right: "PF" }}
                            onChange={(checked) => {
                                if (checked) {
                                    setStateRuleset("pf");
                                    plausibleEvent("ruleset", "pf");
                                } else {
                                    setStateRuleset("e5");
                                    plausibleEvent("ruleset", "e5");
                                }
                            }}
                            checked={ruleset === "pf"}
                            backgroundImages={{ left: dndSvg, right: pfSvg }}
                        />
                    </div>
                    <div className={"hp-mode setting"}>
                        HP Bar Segments:{" "}
                        <input
                            type={"text"}
                            size={2}
                            value={segments}
                            onChange={(e) => {
                                const nValue = Number(e.target.value.replace(/[^0-9]/g, ""));
                                setSegments(nValue);
                                plausibleEvent("segments", nValue.toString());
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "ArrowUp") {
                                    setSegments(segments + 1);
                                    plausibleEvent("segmentsUp", `${segments + 1}`);
                                } else if (e.key === "ArrowDown") {
                                    setSegments(segments - 1);
                                    plausibleEvent("segmentsDown", `${segments - 1}`);
                                }
                            }}
                        />
                    </div>
                    <div className={"hp-position setting"}>
                        Text and Bar Offset:{" "}
                        <input
                            type={"text"}
                            size={2}
                            value={offset}
                            onChange={(e) => {
                                const factor = e.target.value.startsWith("-") ? -1 : 1;
                                const nValue = Number(e.target.value.replace(/[^0-9]/g, ""));
                                handleOffsetChange(nValue * factor);
                                plausibleEvent("offset", `${nValue * factor}`);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "ArrowUp") {
                                    handleOffsetChange(offset + 1);
                                    plausibleEvent("offsetUp", `${offset + 1}`);
                                } else if (e.key === "ArrowDown") {
                                    handleOffsetChange(offset - 1);
                                    plausibleEvent("offsetDown", `${offset - 1}`);
                                }
                            }}
                        />
                    </div>
                    <div className={"ac setting"}>
                        <h4>Armorclass</h4>
                        <div className={"ac-position"}>
                            AC Offset: X{" "}
                            <input
                                type={"text"}
                                size={2}
                                value={acOffset.x}
                                onChange={(e) => {
                                    const factor = e.target.value.startsWith("-") ? -1 : 1;
                                    const nValue = Number(e.target.value.replace(/[^0-9]/g, ""));
                                    handleAcOffsetChange(nValue * factor, acOffset.y);
                                }}
                            />
                            Y{" "}
                            <input
                                type={"text"}
                                size={2}
                                value={acOffset.y}
                                onChange={(e) => {
                                    const factor = e.target.value.startsWith("-") ? -1 : 1;
                                    const nValue = Number(e.target.value.replace(/[^0-9]/g, ""));
                                    handleAcOffsetChange(acOffset.x, nValue * factor);
                                }}
                            />
                        </div>
                    </div>
                    <div className={"negative-numbers setting"}>
                        Allow negative HP/AC:
                        <input
                            type={"checkbox"}
                            checked={allowNegativNumbers}
                            onChange={() => {
                                setAllowNegativeNumbers(!allowNegativNumbers);
                                plausibleEvent("negative-numbers", (!allowNegativNumbers).toString());
                            }}
                        />
                    </div>
                    <div className={"player-sort setting"}>
                        Sort Tokens in Player View:
                        <input
                            type={"checkbox"}
                            checked={playerSort}
                            onChange={() => {
                                setPlayerSort(!playerSort);
                                plausibleEvent("player-sort", (!playerSort).toString());
                            }}
                        />
                    </div>
                    <div className={"initiative-dice setting"}>
                        Set Initiative Dice:
                        <input
                            type={"number"}
                            size={1}
                            value={initiativeDice}
                            onChange={(e) => {
                                setInitiativeDice(parseInt(e.target.value));
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
                                defaultValue={statblockPopover.width}
                                onBlur={(e) => {
                                    setStatblockPopover({
                                        ...statblockPopover,
                                        width: Math.max(parseInt(e.target.value), 200),
                                    });
                                    e.currentTarget.value = Math.max(200, parseInt(e.currentTarget.value)).toString();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setStatblockPopover({
                                            ...statblockPopover,
                                            width: Math.max(parseInt(e.currentTarget.value), 200),
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
                                defaultValue={statblockPopover.height}
                                onChange={(e) => {
                                    setStatblockPopover({
                                        ...statblockPopover,
                                        height: Math.max(200, parseInt(e.target.value)),
                                    });
                                    e.currentTarget.value = Math.max(200, parseInt(e.target.value)).toString();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setStatblockPopover({
                                            ...statblockPopover,
                                            height: Math.max(parseInt(e.currentTarget.value)),
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
                    {sceneId ? <Groups sceneId={sceneId} /> : null}
                </>
            </div>
        </>
    );
};
