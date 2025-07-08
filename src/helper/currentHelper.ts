import OBR, { buildShape, Image, Shape } from "@owlbear-rodeo/sdk";
import { getImageBounds, modulo } from "./helpers.ts";
import { addItems, deleteItems, updateItems } from "./obrHelper.ts";
import { UserSettings } from "../api/tabletop-almanac/useUser.ts";
import { GMGMetadata } from "./types.ts";
import { nextTurnChannel } from "./variables.ts";

const indicatorName = "GM's Grimoire - Indicator";

export const createIndicator = async (token: Image) => {
    const bounds = await getImageBounds(token);
    const width = Math.abs(bounds.width) * 1.3;
    const height = Math.abs(bounds.height) * 1.3;
    const position = { x: bounds.position.x + bounds.width / 2, y: bounds.position.y + bounds.height / 2 };

    const indicator = buildShape()
        .width(width)
        .height(height)
        .position(position)
        .shapeType("CIRCLE")
        .fillColor("white")
        .fillOpacity(0.5)
        .strokeColor("red")
        .strokeOpacity(0.7)
        .layer("MOUNT")
        .visible(token.visible)
        .locked(true)
        .disableHit(true)
        .attachedTo(token.id)
        .name(indicatorName)
        .build();

    await addItems([indicator]);
};

export const setIndicator = async (current: Image) => {
    const items = await OBR.scene.items.getItems<Shape>((item) => item.name === indicatorName);
    if (items.length > 0) {
        const indicator = items[0];
        const bounds = await getImageBounds(current);
        const width = Math.abs(bounds.width) * 1.3;
        const height = Math.abs(bounds.height) * 1.3;
        const position = { x: bounds.position.x + bounds.width / 2, y: bounds.position.y + bounds.height / 2 };
        await updateItems([indicator.id], (items) => {
            if (items.length > 0) {
                const item = items[0] as Shape;
                item.attachedTo = current.id;
                item.width = width;
                item.height = height;
                item.position = position;
                item.scale = { x: 1, y: 1 };
                item.visible = current.visible;
            }
        });
    } else {
        await createIndicator(current);
    }
};

export const destroyIndicator = async () => {
    const items = await OBR.scene.items.getItems<Shape | Image>((item) => item.name === indicatorName);
    if (items.length > 0) {
        await deleteItems(items.map((i) => i.id));
    }
};

export const notifyNextPlayer = async (
    nextIndex: number,
    battleTokens: Array<{ data: GMGMetadata; item: Image }>,
    taSettings: UserSettings,
) => {
    if (taSettings.notify_next_turn) {
        let nextToken: { data: GMGMetadata; item: Image };
        if (nextIndex >= 0 && nextIndex < battleTokens.length) {
            nextToken = battleTokens[nextIndex];
        } else if (nextIndex < 0) {
            nextToken = battleTokens[battleTokens.length - 1];
        } else {
            nextToken = battleTokens[modulo(nextIndex, battleTokens.length)];
        }
        if (nextToken.item.createdUserId !== OBR.player.id) {
            await OBR.broadcast.sendMessage(nextTurnChannel, {
                name: (await OBR.party.getPlayers()).find((p) => p.id === nextToken.item.createdUserId)?.name ?? "",
                playerId: nextToken.item.createdUserId,
            });
            return nextToken.item.id;
        }
    }
    return null;
};
