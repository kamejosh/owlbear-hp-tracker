import React, { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

export const PluginGate = ({ children }: { children: React.ReactNode }) => {
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (OBR.isAvailable) {
            OBR.onReady(() => setReady(true));
        }
    }, []);

    if (ready) {
        return <>{children}</>;
    } else {
        return null;
    }
};
