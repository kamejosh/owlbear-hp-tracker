import OBR from "@owlbear-rodeo/sdk";
import { PlayerContext, PlayerContextType } from "../context/PlayerContext.ts";
import React, { PropsWithChildren, useEffect, useState } from "react";

export const ContextWrapper = (props: PropsWithChildren) => {
    const [role, setRole] = useState<string | null>(null);
    const [ready, setReady] = useState<boolean>(false);

    useEffect(() => {
        if (OBR.isAvailable) {
            OBR.onReady(async () => {
                setReady(true);
                setRole(await OBR.player.getRole());
            });
        }
    }, []);

    const playerContext: PlayerContextType = { role: role };

    if (ready) {
        return <PlayerContext.Provider value={playerContext}>{props.children}</PlayerContext.Provider>;
    } else {
        return null;
    }
};
