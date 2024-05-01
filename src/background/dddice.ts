import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { diceTrayModal, diceTrayModalId, metadataKey } from "../helper/variables.ts";
import { DiceUser, RoomMetadata } from "../helper/types.ts";
import { getRoomDiceUser } from "../helper/helpers.ts";
import { AsyncLock } from "../helper/AsyncLock.ts";
import { ThreeDDiceAPI } from "dddice-js";
import { addRollerApiCallbacks, dddiceApiLogin } from "../helper/diceHelper.ts";
import { rollLogStore } from "../context/RollLogContext.tsx";

const lock = new AsyncLock();
const diceRollerState: { diceUser: DiceUser | null; disableDiceRoller: boolean } = {
    diceUser: null,
    disableDiceRoller: false,
};

const initDice = async (room: RoomMetadata, updateApi: boolean) => {
    let api: ThreeDDiceAPI | undefined = undefined;

    if (updateApi) {
        api = await dddiceApiLogin(room);
        if (api) {
            await addRollerApiCallbacks(api, rollLogStore.getState().addRoll);
        } else {
            throw Error("Error connecting to dddice");
        }
    }
    if (diceRollerState.diceUser?.diceRendering) {
        await OBR.modal.open({
            ...diceTrayModal,
            url: `https://dddice.com/room/${room.diceRoom!.slug}/stream?key=${diceRollerState.diceUser.apiKey}`,
        });
    } else {
        await OBR.modal.close(diceTrayModalId);
    }
};

const initDiceRoller = async (room: RoomMetadata, updateApi: boolean) => {
    if (!room?.disableDiceRoller) {
        await initDice(room, updateApi);
    } else {
        await OBR.modal.close(diceTrayModalId);
    }
};

const roomCallback = async (metadata: Metadata, forceLogin: boolean) => {
    await lock.promise;
    lock.enable();
    const roomData = metadataKey in metadata ? (metadata[metadataKey] as RoomMetadata) : null;
    let initialized: boolean = false;
    let reInitialize: boolean = diceRollerState.disableDiceRoller !== roomData?.disableDiceRoller;
    reInitialize =
        reInitialize ||
        diceRollerState.diceUser?.diceRendering !== getRoomDiceUser(roomData, OBR.player.id)?.diceRendering;
    diceRollerState.disableDiceRoller = roomData?.disableDiceRoller === undefined ? false : roomData.disableDiceRoller;

    if (roomData && (!roomData.disableDiceRoller || reInitialize)) {
        const newDiceUser = getRoomDiceUser(roomData, OBR.player.id);
        if (newDiceUser) {
            const newApiKey = newDiceUser.apiKey;
            const diceRendering = newDiceUser.diceRendering;

            if (diceRollerState.diceUser) {
                if (
                    (newApiKey !== undefined && newApiKey !== diceRollerState.diceUser.apiKey) ||
                    diceRendering !== diceRollerState.diceUser.diceRendering
                ) {
                    await initDiceRoller(roomData, forceLogin || newApiKey !== diceRollerState.diceUser.apiKey);
                    diceRollerState.diceUser = newDiceUser;
                    initialized = true;
                }
            } else {
                diceRollerState.diceUser = newDiceUser;
                await initDiceRoller(roomData, forceLogin || true);
                initialized = true;
            }
        }
        if (reInitialize || !initialized) {
            await initDiceRoller(roomData, forceLogin || false);
        }
    }
    lock.disable(null);
};

export const setupDddice = async () => {
    const metadata = await OBR.room.getMetadata();
    await roomCallback(metadata, true);

    OBR.room.onMetadataChange((metadata) => roomCallback(metadata, false));
    console.info("HP Tracker - Finished setting up dddice");
};
