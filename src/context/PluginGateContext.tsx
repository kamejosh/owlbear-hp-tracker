import { ReactNode, useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { SceneReadyContext } from "./SceneReadyContext.ts";

export const PluginGate = ({ children }: { children: ReactNode }) => {
    const [ready, setReady] = useState(false);
    const { setIsReady } = SceneReadyContext();

    useEffect(() => {
        if (OBR.isAvailable) {
            OBR.onReady(() => setReady(true));
        }
    }, []);

    useEffect(() => {
        if (ready) {
            const initIsReady = async () => {
                setIsReady(await OBR.scene.isReady());
            };
            OBR.scene.onReadyChange(async (ready) => {
                setIsReady(ready);
            });
            initIsReady();
        }
    }, [ready]);

    if (ready) {
        return <>{children}</>;
    } else {
        return <>Waiting for owlbear rodeo</>;
    }
};
