import OBR from "@owlbear-rodeo/sdk";
import { PlayerContext, PlayerContextType } from "../context/PlayerContext.ts";
import { PropsWithChildren, useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PluginGate } from "../context/PluginGateContext.tsx";
import { metadataKey } from "../helper/variables.ts";
import { useMetadataContext } from "../context/MetadataContext.ts";
import { RoomMetadata, SceneMetadata } from "../helper/types.ts";
import { Loader } from "./general/Loader.tsx";
import { objectsEqual } from "../helper/helpers.ts";
import { SceneReadyContext } from "../context/SceneReadyContext.ts";
import { useComponentContext } from "../context/ComponentContext.tsx";
import "tippy.js/dist/tippy.css";

type ContextWrapperProps = PropsWithChildren & {
    component: string;
};

export const ContextWrapper = (props: ContextWrapperProps) => {
    const [role, setRole] = useState<string | null>(null);
    const [playerId, setPlayerId] = useState<string | null>(null);
    const [playerName, setPlayerName] = useState<string | null>(null);
    const [ready, setReady] = useState<boolean>(false);
    const { scene, room, setSceneMetadata, setRoomMetadata } = useMetadataContext();
    const { component, setComponent } = useComponentContext();
    const queryClient = new QueryClient();
    const { isReady } = SceneReadyContext();

    useEffect(() => {
        setComponent(props.component);
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
        const setMetadata = async () => {
            const sceneMetadata = await OBR.scene.getMetadata();
            if (metadataKey in sceneMetadata) {
                setSceneMetadata(sceneMetadata[metadataKey] as SceneMetadata);
            }
            const roomMetadata = await OBR.room.getMetadata();
            if (metadataKey in roomMetadata) {
                setRoomMetadata(roomMetadata[metadataKey] as RoomMetadata);
            }
        };

        if (isReady) {
            setMetadata();
            const unsubSceneMetadataChange = OBR.scene.onMetadataChange((metadata) => {
                if (metadataKey in metadata) {
                    const newSceneMetadata = metadata[metadataKey] as SceneMetadata;
                    const sceneState = useMetadataContext.getState().scene;
                    if (!sceneState || !objectsEqual(newSceneMetadata, sceneState)) {
                        setSceneMetadata(newSceneMetadata);
                    }
                }
            });

            const unsubRoomMetadataChange = OBR.room.onMetadataChange((metadata) => {
                if (metadataKey in metadata) {
                    const newRoomMetadata = metadata[metadataKey] as RoomMetadata;
                    const roomState = useMetadataContext.getState().room;
                    if (!roomState || !objectsEqual(newRoomMetadata, roomState)) {
                        setRoomMetadata(newRoomMetadata);
                    }
                }
            });
            return () => {
                unsubRoomMetadataChange();
                unsubSceneMetadataChange();
            };
        }
    }, [isReady]);

    const playerContext: PlayerContextType = { role: role, id: playerId, name: playerName };

    if (ready) {
        return (
            <PluginGate>
                <QueryClientProvider client={queryClient}>
                    <PlayerContext.Provider value={playerContext}>
                        {component && scene && room ? (
                            props.children
                        ) : (
                            <div>
                                HP Tracker - initializing...
                                <Loader className={"initialization-loader"} />
                            </div>
                        )}
                    </PlayerContext.Provider>
                </QueryClientProvider>
            </PluginGate>
        );
    } else {
        return null;
    }
};
