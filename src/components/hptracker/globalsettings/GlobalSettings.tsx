import { useEffect, useState } from "react";
import { useLocalStorage } from "../../../helper/hooks.ts";
import { ID, sceneMetadata } from "../../../helper/variables.ts";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { SceneMetadata } from "../../../helper/types.ts";
import "./global-settings.scss";
import { SceneReadyContext } from "../../../context/SceneReadyContext.ts";
import { updateHpBarOffset } from "../../../helper/shapeHelpers.ts";
import { updateTextOffset } from "../../../helper/textHelpers.ts";
import { Groups } from "./Groups.tsx";
import { Ruleset } from "../../../ttrpgapi/useTtrpgApi.ts";
import { useFilter } from "../../../context/FilterContext.ts";

export const GlobalSettings = ({ sceneId }: { sceneId: string }) => {
    const [offset, setOffset] = useLocalStorage<number>(`${ID}.offset`, 0);
    const [segments, setSegments] = useLocalStorage<number>(`${ID}.hpSegments`, 0);
    const [allowNegativNumbers, setAllowNegativeNumbers] = useLocalStorage<boolean>(
        `${ID}.allowNegativeNumbers`,
        false
    );
    const [ruleset, setRuleset] = useLocalStorage<Ruleset>(`${ID}.ruleset`, "5e");
    const filter = useFilter();
    const { isReady } = SceneReadyContext();
    const [hide, setHide] = useState<boolean>(true);

    useEffect(() => {
        const setSceneMetadata = async () => {
            const metadata: Metadata = await OBR.scene.getMetadata();
            (metadata[sceneMetadata] as SceneMetadata).hpBarOffset = offset;
            (metadata[sceneMetadata] as SceneMetadata).hpBarSegments = segments;
            (metadata[sceneMetadata] as SceneMetadata).allowNegativeNumbers = allowNegativNumbers;
            (metadata[sceneMetadata] as SceneMetadata).ruleset = ruleset;
            await OBR.scene.setMetadata({ sceneMetadata: metadata });
        };
        if (isReady) {
            setSceneMetadata();
        }
    }, [offset, segments, allowNegativNumbers, ruleset]);

    const handleOffsetChange = (value: number) => {
        updateHpBarOffset(value);
        updateTextOffset(value);
        setOffset(value);
    };

    return (
        <div className={"global-setting"}>
            <div className={"heading"}>
                <h3>Global Settings</h3> <button onClick={() => setHide(!hide)}>{hide ? "Show" : "Hide"}</button>
            </div>
            {hide ? null : (
                <>
                    <div className={"hp-mode setting"}>
                        HP Bar Segments:{" "}
                        <input
                            type={"text"}
                            size={2}
                            value={segments}
                            onChange={(e) => {
                                const nValue = Number(e.target.value.replace(/[^0-9]/g, ""));
                                setSegments(nValue);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "ArrowUp") {
                                    setSegments(segments + 1);
                                } else if (e.key === "ArrowDown") {
                                    setSegments(segments - 1);
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
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "ArrowUp") {
                                    handleOffsetChange(offset + 1);
                                } else if (e.key === "ArrowDown") {
                                    handleOffsetChange(offset - 1);
                                }
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
                            }}
                        />
                    </div>
                    <div className={"ruleset setting"}>
                        Choose ruleset for statblocks:
                        <label>
                            5e
                            <input
                                type={"radio"}
                                value={"5e"}
                                name={"source"}
                                checked={ruleset === "5e"}
                                onClick={() => {
                                    setRuleset("5e");
                                    filter.setRuleset("5e");
                                }}
                                onChange={(e) => {
                                    setRuleset(e.currentTarget.checked ? "5e" : "pf2e");
                                    filter.setRuleset(e.currentTarget.checked ? "5e" : "pf2e");
                                }}
                            />
                        </label>
                        <label>
                            PF2e
                            <input
                                type={"radio"}
                                value={"pf2e"}
                                name={"source"}
                                checked={ruleset === "pf2e"}
                                onClick={() => {
                                    setRuleset("pf2e");
                                    filter.setRuleset("pf2e");
                                }}
                                onChange={(e) => {
                                    setRuleset(e.currentTarget.checked ? "pf2e" : "5e");
                                    filter.setRuleset(e.currentTarget.checked ? "pf2e" : "5e");
                                }}
                            />
                        </label>
                    </div>
                    <Groups sceneId={sceneId} />
                </>
            )}
        </div>
    );
};
