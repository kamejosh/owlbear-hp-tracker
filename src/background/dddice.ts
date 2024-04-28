import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { metadataKey } from "../helper/variables.ts";
import { DiceUser, RoomMetadata } from "../helper/types.ts";
import { getRoomDiceUser } from "../helper/helpers.ts";
import { AsyncLock } from "../helper/AsyncLock.ts";
import { ThreeDDiceAPI } from "dddice-js";
import { addRollerBackgroundCallbacks, dddiceApiLogin } from "../helper/diceHelper.ts";
import { rollLogStore } from "../context/RollLogContext.tsx";

const lock = new AsyncLock();
const diceRollerState: { diceUser: DiceUser | null; disableDiceRoller: boolean } = {
    diceUser: null,
    disableDiceRoller: false,
};

const initDice = async (room: RoomMetadata) => {
    let api: ThreeDDiceAPI | undefined = undefined;

    api = await dddiceApiLogin(room);
    if (api) {
        await addRollerBackgroundCallbacks(api, rollLogStore.getState().addRoll);
    }
};

const initDiceRoller = async (room: RoomMetadata) => {
    if ((diceRollerState.diceUser && diceRollerState.diceUser.apiKey !== undefined) || !diceRollerState.diceUser) {
        if (!room?.disableDiceRoller) {
            await initDice(room);
        }
    }
};

const roomCallback = async (metadata: Metadata) => {
    await lock.promise;
    lock.enable();
    const roomData = metadataKey in metadata ? (metadata[metadataKey] as RoomMetadata) : null;
    let initialized: boolean = false;
    const reInitialize: boolean = diceRollerState.disableDiceRoller !== roomData?.disableDiceRoller;
    diceRollerState.disableDiceRoller = roomData?.disableDiceRoller || true;

    if (roomData) {
        const newDiceUser = getRoomDiceUser(roomData, OBR.player.id);
        if (newDiceUser) {
            const newApiKey = newDiceUser.apiKey;
            const diceRendering = newDiceUser.diceRendering;

            if (diceRollerState.diceUser) {
                if (
                    (newApiKey !== undefined && newApiKey !== diceRollerState.diceUser.apiKey) ||
                    diceRendering !== diceRollerState.diceUser.diceRendering
                ) {
                    diceRollerState.diceUser = newDiceUser;
                    await initDiceRoller(roomData);
                    initialized = true;
                }
            } else {
                diceRollerState.diceUser = newDiceUser;
                await initDiceRoller(roomData);
                initialized = true;
            }
        }
        if (reInitialize && !initialized) {
            await initDiceRoller(roomData);
        }
    }
    lock.disable(null);
};

export const setupDddice = async () => {
    const metadata = await OBR.room.getMetadata();
    await roomCallback(metadata);
    OBR.room.onMetadataChange(roomCallback);
    console.info("HP Tracker - Finished setting up dddice");
};
