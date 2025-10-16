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
import { isNaN, isUndefined } from "lodash";
import { getRoomDiceUser } from "../helper/helpers.ts";

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
            if (isNaN(request.hp) || isUndefined(request.hp)) {
                sendError(request, `Error updating HP - Invalid HP value ${request.hp}`);
            } else {
                const items = await OBR.scene.items.getItems([request.itemId]);
                if (items) {
                    const item = items[0];
                    const data = item.metadata[itemMetadataKey] as GMGMetadata;
                    const newData = { ...data, hp: Math.min(Number(request.hp), data.maxHp) };
                    await updateTokenMetadata(newData, [item.id]);
                    await updateHp(item, newData);
                    sendResponse(request, { hp: Math.min(request.hp, data.maxHp) } as HPResponse);
                } else {
                    sendError(request, "Error updating HP - Item not found");
                }
            }
        } catch {
            sendError(request, "Error updating HP");
        }
    });

    OBR.broadcast.onMessage(tempHpRoute, async (message) => {
        const request = message.data as TempHPRequest;
        try {
            if (isNaN(request.tempHP) || isUndefined(request.tempHP)) {
                sendError(request, `Error updating Temp HP - Invalid Temp HP value ${request.tempHP}`);
                return;
            } else {
                const items = await OBR.scene.items.getItems([request.itemId]);
                if (items) {
                    const item = items[0];
                    const data = item.metadata[itemMetadataKey] as GMGMetadata;

                    await changeTempHp(Number(request.tempHP), data, item as Image);

                    const newData = item.metadata[itemMetadataKey] as GMGMetadata;
                    sendResponse(request, { tempHP: newData.stats.tempHp } as TempHPResponse);
                } else {
                    sendError(request, "Error updating Temp HP - Item not found");
                }
            }
        } catch {
            sendError(request, "Error updating TempHP");
        }
    });

    OBR.broadcast.onMessage(acRoute, async (message) => {
        const request = message.data as ACRequest;
        try {
            if (isNaN(request.ac) || isUndefined(request.ac)) {
                sendError(request, `Error updating AC - Invalid AC value ${request.ac}`);
            } else {
                const items = await OBR.scene.items.getItems([request.itemId]);
                if (items) {
                    const item = items[0];
                    const data = item.metadata[itemMetadataKey] as GMGMetadata;
                    const ac = Math.max(Number(request.ac), 0);
                    const newData = { ...data, armorClass: ac };
                    await updateTokenMetadata(newData, [item.id]);
                    await updateAc(item, newData);
                    sendResponse(request, { ac: ac } as ACResponse);
                } else {
                    sendError(request, "Error updating AC - Item not found");
                }
            }
        } catch {
            sendError(request, "Error updating AC");
        }
    });

    OBR.broadcast.onMessage(initRoute, async (message) => {
        const request = message.data as InitRequest;
        try {
            if (isNaN(request.initiative) || isUndefined(request.initiative)) {
                sendError(request, `Error updating Initiative - Invalid Initiative value ${request.initiative}`);
            } else {
                const items = await OBR.scene.items.getItems([request.itemId]);
                if (items) {
                    const item = items[0];
                    const data = item.metadata[itemMetadataKey] as GMGMetadata;
                    const newData = { ...data, initiative: request.initiative };
                    await updateTokenMetadata(newData, [item.id]);
                    sendResponse(request, { initiative: newData.initiative } as InitResponse);
                } else {
                    sendError(request, "Error updating Initiative - Item not found");
                }
            }
        } catch {
            sendError(request, "Error updating Initiative");
        }
    });

    OBR.broadcast.onMessage(diceRoute, async (message) => {
        const request = message.data as DiceRequest;
        const room = await OBR.room.getMetadata();
        const dddiceApi = diceRollerStore.getState().rollerApi;
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
            } else if (roomData.diceRoller === DICE_ROLLER.DDDICE && dddiceApi) {
                const dddiceRoomUser = getRoomDiceUser(roomData, OBR.player.id);
                const parsed = diceToRoll(request.notation, dddiceRoomUser?.diceTheme ?? "dddice-bees");
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
