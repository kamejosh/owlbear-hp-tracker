import { GMG_ID, itemMetadataKey, metadataKey } from "../helper/variables.ts";
import OBR, { Image } from "@owlbear-rodeo/sdk";
import { DICE_ROLLER, GMGMetadata, RoomMetadata } from "../helper/types.ts";
import { updateHp } from "../helper/hpHelpers.ts";
import { updateAc } from "../helper/acHelper.ts";
import { changeTempHp, updateTokenMetadata } from "../helper/tokenHelper.ts";
import { rollLogStore } from "../context/RollLogContext.tsx";
import { dicePlusRoll, diceToRoll, getUserUuid, localRoll, rollWrapper } from "../helper/diceHelper.ts";
import { diceRollerStore } from "../context/DDDiceContext.tsx";
import { DicePlusRollResultData } from "./diceplus.ts";
import { DiceRoll } from "@dice-roller/rpg-dice-roller";
import { IRoll } from "dddice-js";

const hpRoute = `${GMG_ID}/api/hp`;
const tempHpRoute = `${GMG_ID}/api/temp-hp`;
const acRoute = `${GMG_ID}/api/ac`;
const initRoute = `${GMG_ID}/api/initiative`;
const diceRoute = `${GMG_ID}/api/roll`;

const responseChannel = `${GMG_ID}/api/response`;
const errorChannel = `${GMG_ID}/api/error`;

type Request = {
    requestId: string;
};

type Response = {
    requestId: string;
};

type HPRequest = Request & {
    itemId: string;
    hp: number;
};

type HPResponse = Response & {
    hp: number;
};

type TempHPRequest = Request & {
    itemId: string;
    tempHP: number;
};

type TempHPResponse = Response & {
    tempHP?: number;
};

type ACRequest = Request & {
    itemId: string;
    ac: number;
};

type ACResponse = Response & {
    ac: number;
};

type InitRequest = Request & {
    itemId: string;
    initiative: number;
};

type InitResponse = Response & {
    initiative: number;
};

type DiceRequest = Request & {
    notation: string;
    hidden: boolean;
    label: string;
    statblock?: string;
};

type DiceResponse = Response & {
    total?: number;
};

type ErrorResponse = Response & {
    error: string;
};

const sendError = (request: Request, error: string) => {
    const requestId = Object(request).hasOwnProperty("requestId") ? request.requestId : "0";
    void OBR.broadcast.sendMessage(errorChannel, { requestId: requestId, error: error } as ErrorResponse, {
        destination: "LOCAL",
    });
};

const sendResponse = (request: Request, response: Partial<Response>) => {
    const requestId = Object(request).hasOwnProperty("requestId") ? request.requestId : "0";
    void OBR.broadcast.sendMessage(responseChannel, { ...response, requestId: requestId }, { destination: "LOCAL" });
};

export const registerMessageHandlers = async () => {
    OBR.broadcast.onMessage(hpRoute, async (message) => {
        const request = message.data as HPRequest;
        try {
            const items = await OBR.scene.items.getItems([request.itemId]);
            if (items) {
                const item = items[0];
                const data = item.metadata[itemMetadataKey] as GMGMetadata;
                await updateHp(item, { ...data, hp: Math.min(request.hp, data.maxHp) });
                sendResponse(request, { hp: Math.min(request.hp, data.maxHp) } as HPResponse);
            }
        } catch {
            sendError(request, "Error updating HP");
        }
    });

    OBR.broadcast.onMessage(hpRoute, async (message) => {
        const request = message.data as TempHPRequest;
        try {
            const items = await OBR.scene.items.getItems([request.itemId]);
            if (items) {
                const item = items[0];
                const data = item.metadata[itemMetadataKey] as GMGMetadata;

                await changeTempHp(request.tempHP, data, item as Image);

                const newData = item.metadata[itemMetadataKey] as GMGMetadata;
                sendResponse(request, { tempHP: newData.stats.tempHp } as TempHPResponse);
            }
        } catch {
            sendError(request, "Error updating TempHP");
        }
    });

    OBR.broadcast.onMessage(acRoute, async (message) => {
        const request = message.data as ACRequest;
        try {
            const items = await OBR.scene.items.getItems([request.itemId]);
            if (items) {
                const item = items[0];
                const data = item.metadata[itemMetadataKey] as GMGMetadata;
                const ac = Math.max(request.ac, 0);
                await updateAc(item, { ...data, armorClass: ac });
                sendResponse(request, { ac: ac } as ACResponse);
            }
        } catch {
            sendError(request, "Error updating AC");
        }
    });

    OBR.broadcast.onMessage(initRoute, async (message) => {
        const request = message.data as InitRequest;
        try {
            const items = await OBR.scene.items.getItems([request.itemId]);
            if (items) {
                const item = items[0];
                const data = item.metadata[itemMetadataKey] as GMGMetadata;
                const newData = { ...data, initiative: request.initiative };
                await updateTokenMetadata(newData, [item.id]);
                sendResponse(request, { initiative: newData.initiative } as InitResponse);
            }
        } catch {
            sendError(request, "Error updating Initiative");
        }
    });

    OBR.broadcast.onMessage(diceRoute, async (message) => {
        const request = message.data as DiceRequest;
        const room = await OBR.room.getMetadata();
        const dddiceApi = diceRollerStore.getState().rollerApi;
        const theme = diceRollerStore.getState().theme;
        const addRoll = rollLogStore.getState().addRoll;

        try {
            const roomData = room[metadataKey] as RoomMetadata;
            if (roomData.diceRoller === DICE_ROLLER.SIMPLE) {
                const simpleResult = await localRoll(
                    request.notation,
                    request.label,
                    addRoll,
                    request.hidden,
                    request.statblock,
                );
                if (simpleResult) {
                    sendResponse(request, { total: simpleResult.total } as DiceResponse);
                } else {
                    sendError(request, "Error rolling dice");
                }
            } else if (roomData.diceRoller === DICE_ROLLER.DDDICE && dddiceApi && theme) {
                const parsed = diceToRoll(request.notation, theme.id);
                if (parsed) {
                    const dddiceResult = await rollWrapper(dddiceApi, parsed.dice, {
                        label: request.label,
                        operator: parsed.operator,
                        external_id: request.statblock,
                        whisper: request.hidden ? await getUserUuid(room, dddiceApi) : undefined,
                    });
                    if (dddiceResult) {
                        sendResponse(request, { total: Number(dddiceResult.total_value) } as DiceResponse);
                    } else {
                        sendError(request, "Error rolling dice");
                    }
                } else {
                    sendError(request, "Error parsing dice notation with dddice");
                }
            } else if (roomData.diceRoller === DICE_ROLLER.DICE_PLUS) {
                await dicePlusRoll(
                    request.notation,
                    request.label,
                    addRoll,
                    request.hidden,
                    request.statblock,
                    (rollResult: DiceRoll | IRoll | DicePlusRollResultData | null | undefined) => {
                        if (rollResult && "result" in rollResult) {
                            sendResponse(request, { total: rollResult.result.totalValue } as DiceResponse);
                        }
                    },
                );
            } else {
                sendError(request, "Error rolling dice - No valid dice roller found.");
            }
        } catch {
            sendError(request, "Error rolling dice");
        }
    });
};
