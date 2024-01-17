import OBR from "@owlbear-rodeo/sdk";
import { PlayerContext, PlayerContextType } from "../context/PlayerContext.ts";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PluginGate } from "../context/PluginGateContext.tsx";
import { DiceContext } from "../context/DDDiceContext.tsx";
import { ThreeDDice } from "dddice-js";
import { DDDICE_API_KEY } from "../config.ts";
import { SceneReadyContext } from "../context/SceneReadyContext.ts";

export const ContextWrapper = (props: PropsWithChildren) => {
    const [role, setRole] = useState<string | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState<string | null>(null);
    const [ready, setReady] = useState<boolean>(false);
    const [dice, setDice] = useState<ThreeDDice>();
    const { isReady } = SceneReadyContext();
    const canvasRef = useRef(null);
    const queryClient = new QueryClient();

    useEffect(() => {
        if (OBR.isAvailable) {
            OBR.onReady(async () => {
                setReady(true);
                setRole(await OBR.player.getRole());
                setPlayerId(OBR.player.id);
                setPlayerName(await OBR.player.getName());
            });
        }
    }, []);

    useEffect(() => {
        if (canvasRef.current && isReady && !dice) {
            const localDice = new ThreeDDice(canvasRef.current, DDDICE_API_KEY, { bgOpacity: 0 });
            setDice(localDice);
        }
    }, [canvasRef, isReady]);

    useEffect(() => {
        const initDice = async () => {
            if (dice) {
                const roomMetadata = await OBR.room.getMetadata();
                const playerId = await OBR.player.getId();
                let roomSlug: string | undefined = "";
                let userId: string | undefined = undefined;
                if ("com.dddice/roomSlug" in roomMetadata) {
                    roomSlug = roomMetadata["com.dddice/roomSlug"] as string;
                }
                if (`com.dddice/${playerId}` in roomMetadata) {
                    userId = roomMetadata[`com.dddice/${playerId}`] as string;
                }
                if (roomSlug === "") {
                    const room = await dice.api?.room.create();
                    roomSlug = room?.data.slug;
                }
                dice.start();
                if (roomSlug) {
                    dice.connect(roomSlug);
                }
            }
        };

        if (dice) {
            initDice();
        }
    }, [dice]);

    const playerContext: PlayerContextType = { role: role, id: playerId, name: playerName };

    if (ready) {
        return (
            <PluginGate>
                <QueryClientProvider client={queryClient}>
                    <DiceContext.Provider value={{ dice: dice }}>
                        <PlayerContext.Provider value={playerContext}>{props.children}</PlayerContext.Provider>
                    </DiceContext.Provider>
                    <canvas ref={canvasRef} id={"DiceCanvas"}></canvas>
                </QueryClientProvider>
            </PluginGate>
        );
    } else {
        return null;
    }
};
