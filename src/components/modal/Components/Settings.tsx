import { useLocalStorage } from "../../../helper/hooks.ts";
import { ID, modalId, sceneMetadata } from "../../../helper/variables.ts";
import { Ruleset, SceneMetadata } from "../../../helper/types.ts";
import { SceneReadyContext } from "../../../context/SceneReadyContext.ts";
import { useEffect, useState } from "react";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { updateHpBarOffset } from "../../../helper/shapeHelpers.ts";
import { updateTextOffset } from "../../../helper/textHelpers.ts";
import { Groups } from "./Groups.tsx";
import "./global-settings.scss";
import { Switch } from "../../general/Switch/Switch.tsx";
import { dndSvg, pfSvg } from "./SwitchBackground.ts";
import { plausibleEvent } from "../../../helper/helpers.ts";
import { updateAcOffset } from "../../../helper/acHelper.ts";

export const Settings = () => {
    const [offset, setOffset] = useLocalStorage<number>(`${ID}.offset`, 0);
    const [acOffset, setAcOffset] = useLocalStorage<{ x: number; y: number }>(`${ID}.acOffset`, { x: 0, y: 0 });
    const [segments, setSegments] = useLocalStorage<number>(`${ID}.hpSegments`, 0);
    const [allowNegativNumbers, setAllowNegativeNumbers] = useLocalStorage<boolean>(
        `${ID}.allowNegativeNumbers`,
        false
    );
    const [ruleset, setStateRuleset] = useLocalStorage<Ruleset>(`${ID}.ruleset`, "e5");
    const { isReady } = SceneReadyContext();
    const [sceneId, setSceneId] = useState<string | null>(null);

    useEffect(() => {
        const setSceneMetadata = async () => {
            const metadata: Metadata = await OBR.scene.getMetadata();
            // We use version and id from the saved metadata, no need to refresh this
            const hpTrackerSceneMetadata = metadata[sceneMetadata] as SceneMetadata;
            hpTrackerSceneMetadata.hpBarOffset = offset;
            hpTrackerSceneMetadata.acOffset = acOffset;
            hpTrackerSceneMetadata.hpBarSegments = segments;
            hpTrackerSceneMetadata.allowNegativeNumbers = allowNegativNumbers;
            hpTrackerSceneMetadata.ruleset = ruleset;
            const ownMetadata: Metadata = {};
            ownMetadata[sceneMetadata] = hpTrackerSceneMetadata;

            await OBR.scene.setMetadata(ownMetadata);
        };
        if (isReady) {
            setSceneMetadata();
        }
    }, [offset, segments, allowNegativNumbers, ruleset, acOffset]);

    const handleOffsetChange = (value: number) => {
        updateHpBarOffset(value);
        updateTextOffset(value);
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
                    <div className={"ac-position setting"}>
                        AC Offset X:{" "}
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
                        AC Offset Y:{" "}
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
                    {sceneId ? <Groups sceneId={sceneId} /> : null}
                </>
            </div>
        </>
    );
};
