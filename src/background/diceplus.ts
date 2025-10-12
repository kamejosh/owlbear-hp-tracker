import OBR from "@owlbear-rodeo/sdk";
import { dicePlusAvailableKey, GMG_ID, metadataKey } from "../helper/variables.ts";
import { DICE_ROLLER, RoomMetadata } from "../helper/types.ts";
import { delay, updateRoomMetadata } from "../helper/helpers.ts";

type DicePlusReadyData = { requestId: string; ready: true; timestamp: number };
export type DicePlusRollRequestData = {
    rollId: string;
    playerId: string;
    playerName: string;
    rollTarget: "everyone" | "self" | "dm";
    diceNotation: string;
    showResults: boolean;
    timestamp: number;
    source: string;
};

export type DicePlusRollDiceResult = {
    diceId: string;
    rollId: string;
    diceType: string;
    value: number;
    kept: boolean;
};

export type DicePlusRollResultData = {
    rollId: string;
    playerId: string;
    playerName: string;
    rollTarget: "everyone" | "self" | "dm";
    timestamp: number;
    result: {
        rollId: string;
        diceNotation: string;
        totalValue: number;
        rollSummary: string;
        individualResults: Array<DicePlusRollDiceResult>;
        finalResults: Array<DicePlusRollDiceResult>;
    };
};

export type DicePlusRollErrorData = {
    rollId: string;
    notation: string;
    error: string;
};

export const dicePlusRequestChannel = "dice-plus/roll-request";
export const dicePlusResponseChannel = `${GMG_ID}/roll-result`;
// export const dicePlusResponseChannel = `dice-plus/roll-result`;
export const dicePlusErrorChannel = `${GMG_ID}/roll-error`;

async function checkDicePlusReady(): Promise<boolean> {
    const requestId = crypto.randomUUID();

    return new Promise((resolve) => {
        const unsubscribe = OBR.broadcast.onMessage("dice-plus/isReady", (event) => {
            const data = event.data as DicePlusReadyData;

            // Check if this is a response (not a request)
            if ("ready" in data && data.requestId === requestId) {
                unsubscribe();
                resolve(true);
            }
        });

        // Send ready check request
        OBR.broadcast.sendMessage(
            "dice-plus/isReady",
            {
                requestId,
                timestamp: Date.now(),
            },
            { destination: "ALL" },
        );

        // Timeout after 1 second if no response
        setTimeout(() => {
            unsubscribe();
            resolve(false);
        }, 1000);
    });
}

export const setupDicePlus = async () => {
    const metadata = await OBR.room.getMetadata();
    const roomData = metadataKey in metadata ? (metadata[metadataKey] as RoomMetadata) : null;

    if (roomData?.diceRoller === DICE_ROLLER.DICE_PLUS) {
        let isDicePlusReady = await checkDicePlusReady();
        if (!isDicePlusReady) {
            await delay(5000);
            isDicePlusReady = await checkDicePlusReady();
        }

        if (isDicePlusReady) {
            window.localStorage.setItem(dicePlusAvailableKey, "true");
            console.info("Dice Plus Roller initialized");
        } else {
            window.localStorage.setItem(dicePlusAvailableKey, "false");

            await updateRoomMetadata(roomData, { diceRoller: DICE_ROLLER.SIMPLE });
        }
    }
};
