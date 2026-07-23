import OBR from "@owlbear-rodeo/sdk";
import axios from "axios";
import { RollLogEntryType } from "../context/RollLogContext.tsx";
import { metadataKey } from "./variables.ts";
import { RoomMetadata } from "./types.ts";
import { isArray } from "lodash";

const formatTotalValue = (value: RollLogEntryType["total_value"]): string => {
    if (Array.isArray(value)) {
        return value.map((v) => (typeof v === "string" ? v : "🎲")).join(", ");
    }
    return value;
};

// mirrors the .label-detail color classes in src/_css/components/_dddice.scss so the roll's
// color in Discord matches the color it's shown with in the in-app roll log
const labelTypeColors: Record<string, number> = {
    "to-hit": 0x1b9af0,
    attack: 0x1b9af0,
    cast: 0x1b9af0,
    damage: 0xdf7b7b,
    "critical-damage": 0xff3b3b,
    check: 0xb55dff,
    save: 0x6cbf5b,
    custom: 0xf5a623,
    roll: 0xf5a623,
};

const defaultEmbedColor = 0x5865f2;

const getEmbedColor = (label?: string): number => {
    if (!label) {
        return defaultEmbedColor;
    }
    const parts = label.split(":");
    if (parts.length !== 2) {
        return defaultEmbedColor;
    }
    const type = parts[1].trim().toLowerCase().replace(" ", "-");
    return labelTypeColors[type] ?? defaultEmbedColor;
};

export const postRollToDiscord = async (entry: RollLogEntryType) => {
    if (entry.is_hidden) {
        return;
    }

    try {
        const metadata = await OBR.room.getMetadata();
        const webhookUrl = (metadata[metadataKey] as RoomMetadata | undefined)?.discordWebhookUrl;
        if (!webhookUrl) {
            return;
        }

        const author = entry.username || entry.participantUsername || "Unknown";
        const footerText =
            entry.participantUsername && entry.participantUsername !== entry.username
                ? `Rolled by ${entry.participantUsername}`
                : undefined;
        const detail = entry.values.length > 0 ? entry.values.join(", ").replaceAll(", +", " + ") : undefined;

        const hasResult = isArray(entry.total_value) ? entry.total_value.length > 0 : entry.total_value !== "";

        const fields = [...(detail ? [{ name: "Rolls", value: detail, inline: true }] : [])];

        if (hasResult) {
            fields.push({ name: "Result", value: formatTotalValue(entry.total_value), inline: true });
        }

        await axios.request({
            method: "post",
            url: webhookUrl,
            headers: { "Content-Type": "application/json" },
            data: {
                embeds: [
                    {
                        author: { name: author },
                        title: entry.label || "Dice Roll",
                        description: entry.equation || undefined,
                        fields: fields,
                        footer: footerText ? { text: footerText } : undefined,
                        color: getEmbedColor(entry.label),
                        timestamp: entry.created_at,
                        thumbnail: entry.imageUrl ? { url: entry.imageUrl } : undefined,
                    },
                ],
            },
        });
    } catch (e) {
        console.warn("GM's Grimoire - failed to post roll to Discord", e);
    }
};
