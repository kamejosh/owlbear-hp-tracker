import { useEffect, useRef, useState } from "react";
import { getRoomDiceUser, objectsEqual } from "../../../helper/helpers.ts";
import OBR from "@owlbear-rodeo/sdk";
import { ThreeDDice } from "dddice-js";
import { addRollerCallbacks, getDiceRoom, prepareRoomUser } from "../../../helper/diceHelper.ts";
import { metadataKey } from "../../../helper/variables.ts";
import { RoomMetadata } from "../../../helper/types.ts";
import { PluginGate } from "../../../context/PluginGateContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";

export const DiceCanvas = () => {
    const [ready, setReady] = useState<boolean>(false);
    const [room, setRoomMetadata] = useMetadataContext((state) => [state.room, state.setRoomMetadata]);

    useEffect(() => {
        const initContext = async () => {
            // this throws an error when creating a new room so we catch it
            try {
                const roomMetadata = await OBR.room.getMetadata();
                if (metadataKey in roomMetadata) {
                    setRoomMetadata(roomMetadata[metadataKey] as RoomMetadata);
                }
            } catch {}

            OBR.room.onMetadataChange((metadata) => {
                if (metadataKey in metadata) {
                    const newRoomMetadata = metadata[metadataKey] as RoomMetadata;
                    if (!room || !objectsEqual(newRoomMetadata, room)) {
                        setRoomMetadata(newRoomMetadata);
                    }
                }
            });
        };
        if (ready) {
            initContext();
        }
    }, [ready]);

    useEffect(() => {
        if (OBR.isAvailable) {
            OBR.onReady(async () => {
                setReady(true);
            });
        }
    }, []);

    return ready ? (
        <PluginGate>
            <Content />
        </PluginGate>
    ) : null;
};

const Content = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [initialized, setInitialized] = useState<boolean>(false);
    const addRoll = useRollLogContext((state) => state.addRoll);

    useEffect(() => {
        const init = async () => {
            const metadata = await OBR.room.getMetadata();
            if (metadataKey in metadata) {
                const room = metadata[metadataKey] as RoomMetadata;

                if (canvasRef && canvasRef.current && room && !initialized) {
                    const diceUser = getRoomDiceUser(room, OBR.player.id);
                    if (diceUser) {
                        const apiKey = diceUser.apiKey;
                        const roller = new ThreeDDice();
                        roller.initialize(canvasRef.current, apiKey, { autoClear: 3 }, "HP Tracker");

                        if (roller.api) {
                            const diceRoom = await getDiceRoom(roller.api, room);
                            const user = (await roller.api?.user.get())?.data;
                            if (diceRoom && user) {
                                await prepareRoomUser(diceRoom, roller.api);
                                roller.connect(diceRoom.slug, diceRoom.passcode, user.uuid);
                                roller.start();
                                await addRollerCallbacks(roller, addRoll);
                            }
                        }
                    }
                    setInitialized(true);
                }
            }
        };

        init();
    }, []);

    return (
        <>
            <canvas ref={canvasRef} id={"DiceCanvas"}></canvas>
        </>
    );
};
