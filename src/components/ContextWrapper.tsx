import OBR from "@owlbear-rodeo/sdk";
import { PlayerContext, PlayerContextType } from "../context/PlayerContext.ts";
import React, { PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const ContextWrapper = (props: PropsWithChildren) => {
    const [role, setRole] = useState<string | null>(null);
    const [ready, setReady] = useState<boolean>(false);
    const queryClient = new QueryClient();

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
        return (
            <QueryClientProvider client={queryClient}>
                <PlayerContext.Provider value={playerContext}>{props.children}</PlayerContext.Provider>
            </QueryClientProvider>
        );
    } else {
        return null;
    }
};
