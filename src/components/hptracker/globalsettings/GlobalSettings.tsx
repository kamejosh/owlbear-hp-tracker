import React, { useEffect, useState } from "react";
import { useLocalStorage } from "../../../helper/hooks.ts";
import { ID, sceneMetadata } from "../../../helper/variables.ts";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { SceneMetadata } from "../../../helper/types.ts";
import "./global-settings.scss";

export const GlobalSettings = () => {
    const [offset, setOffset] = useLocalStorage<number>(`${ID}.offset`, 0);
    const [segments, setSegments] = useLocalStorage<number>(`${ID}.hpSegments`, 0);
    const [isReady, setIsReady] = useState<boolean>(false);
    const [hide, setHide] = useState<boolean>(true);

    useEffect(() => {
        const setSceneMetadata = async () => {
            const metadata: Metadata = await OBR.scene.getMetadata();
            (metadata[sceneMetadata] as SceneMetadata).hpBarOffset = offset;
            (metadata[sceneMetadata] as SceneMetadata).hpBarSegments = segments;
            await OBR.scene.setMetadata(metadata);
        };
        if (isReady) {
            setSceneMetadata();
        }
    }, [offset, segments]);

    const initIsReady = async () => {
        setIsReady(await OBR.scene.isReady());
    };

    useEffect(() => {
        OBR.scene.onReadyChange(async (ready) => {
            setIsReady(ready);
        });
        initIsReady();
    }, []);

    const handleOffsetChange = (value: number) => {
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
                </>
            )}
        </div>
    );
};
