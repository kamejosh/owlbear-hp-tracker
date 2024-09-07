import OBR, { Metadata } from "@owlbear-rodeo/sdk";
import { diceTrayModal, diceTrayModalId, metadataKey, rollMessageChannel } from "../helper/variables.ts";
import { DiceUser, RoomMetadata } from "../helper/types.ts";
import { getRoomDiceUser } from "../helper/helpers.ts";
import { AsyncLock } from "../helper/AsyncLock.ts";
import { ThreeDDiceAPI } from "dddice-js";
import {
    addRollerApiCallbacks,
    blastMessage,
    connectToDddiceRoom,
    dddiceApiLogin,
    handleNewRoll,
    removeRollerApiCallbacks,
    rollerCallback,
} from "../helper/diceHelper.ts";
import { RollLogEntryType, rollLogStore } from "../context/RollLogContext.tsx";
import { diceRollerStore } from "../context/DDDiceContext.tsx";

const lock = new AsyncLock();
const diceRollerState: { diceUser: DiceUser | null; disableDiceRoller: boolean; diceRoom?: string } = {
    diceUser: null,
    disableDiceRoller: false,
};

const initDice = async (room: RoomMetadata, updateApi: boolean) => {
    let api: ThreeDDiceAPI | undefined | null = undefined;

    if (updateApi) {
        api = await dddiceApiLogin(room);
        if (api) {
            diceRollerStore.getState().setRollerApi(api);
        } else {
            throw Error("Error connecting to dddice");
        }
    } else {
        api = diceRollerStore.getState().rollerApi;
    }

    if (diceRollerState.diceUser?.diceRendering && !diceRollerStore.getState().dddiceExtensionLoaded) {
        await OBR.modal.close(diceTrayModalId);
        await OBR.modal.open({
            ...diceTrayModal,
            url: `https://dddice.com/room/${room.diceRoom!.slug}/stream?key=${diceRollerState.diceUser.apiKey}`,
        });
        if (api) {
            await removeRollerApiCallbacks();
        }
    } else {
        if (api && !diceRollerStore.getState().dddiceExtensionLoaded) {
            await addRollerApiCallbacks(api, rollLogStore.getState().addRoll);
        }
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
            await initDiceRoller(roomData, forceLogin);
        }

        diceRollerState.diceRoom = roomData.diceRoom?.slug;
    } else if (diceRollerState.diceRoom !== roomData?.diceRoom?.slug) {
        const api = diceRollerStore.getState().rollerApi;
        if (api && roomData?.diceRoom?.slug) {
            diceRollerState.diceRoom = roomData.diceRoom.slug;
            await connectToDddiceRoom(api, roomData);
        }
    }
    lock.disable(null);
};

export const setupDddice = async () => {
    const metadata = await OBR.room.getMetadata();
    await roomCallback(metadata, true);

    OBR.room.onMetadataChange((metadata) => roomCallback(metadata, false));
    // get dice rolls from integrated dice roller
    OBR.broadcast.onMessage(rollMessageChannel, (event) => {
        handleNewRoll(rollLogStore.getState().addRoll, event.data as RollLogEntryType);
    });
    // handle dice rolls from dddice
    window.addEventListener("message", async (event) => {
        try {
            if (event.type === "message") {
                if (event.data.type === "roll:finished") {
                    await rollerCallback(event.data.roll, rollLogStore.getState().addRoll);
                }
                if (event.data.type === "dddice.loaded") {
                    diceRollerStore.getState().setDddiceExtensionLoaded(true);
                    await roomCallback(await OBR.room.getMetadata(), false);
                }
            }
        } catch {}
    });
    blastMessage({ type: "dddice.isLoaded" });
    console.info("GM's Grimoire - Finished setting up dddice");
};
