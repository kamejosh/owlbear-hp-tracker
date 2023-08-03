import React, { useEffect, useState } from "react";
import { useLocalStorage } from "../../../helper/hooks.ts";
import { ID, sceneMetadata } from "../../../helper/variables.ts";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { SceneMetadata } from "../../../helper/types.ts";

export const GlobalSettings = () => {
    const [offset, setOffset] = useLocalStorage<number>(`${ID}.offset`, 0);
    const [mode, setMode] = useLocalStorage<number>(`${ID}.hpmode`, 0);
    const [isReady, setIsReady] = useState<boolean>(false);

    useEffect(() => {
        const setSceneMetadata = async () => {
            const metadata: Metadata = await OBR.scene.getMetadata();
            (metadata[sceneMetadata] as SceneMetadata).hpBarOffset = offset;
            (metadata[sceneMetadata] as SceneMetadata).hpBarMode = mode;
            await OBR.scene.setMetadata(metadata);
        };
        if (isReady) {
            setSceneMetadata();
        }
    }, [offset, mode]);

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
            <h3>Global Settings</h3>
            <div className={"hp-mode"}>
                <h4>HP-Bar Mode</h4>
                <button
                    onClick={() => {
                        setMode(0);
                    }}
                >
                    F
                </button>
                <button
                    onClick={() => {
                        setMode(4);
                    }}
                >
                    4
                </button>
            </div>
            <div className={"hp-position"}>
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
        </div>
    );
};
