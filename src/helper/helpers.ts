import OBR, { Image, Item, Metadata } from "@owlbear-rodeo/sdk";
import { infoMetadataKey, itemMetadataKey, metadataKey } from "./variables.ts";
import {
    AttachmentMetadata,
    HpTrackerMetadata,
    InitialStatblockData,
    Limit,
    RoomMetadata,
    SceneMetadata,
} from "./types.ts";
import { isObject, isUndefined } from "lodash";
import { IRoll, IRoomParticipant } from "dddice-js";
import { RollLogEntryType } from "../context/RollLogContext.tsx";
import { TTRPG_URL } from "../config.ts";
import axios from "axios";
import diff_match_patch from "./diff/diff_match_patch.ts";
import { E5Statblock } from "../api/e5/useE5Api.ts";
import { PfStatblock } from "../api/pf/usePfApi.ts";
import axiosRetry from "axios-retry";
import { Ability } from "../components/hptracker/charactersheet/e5/E5Ability.tsx";

export const getYOffset = async (height: number) => {
    const metadata = (await OBR.room.getMetadata()) as Metadata;
    const roomMetadata = metadata[metadataKey] as RoomMetadata;
    let offset = roomMetadata ? (roomMetadata.hpBarOffset ?? 0) : 0;
    const offsetFactor = height / 150;
    offset *= offsetFactor;
    return offset;
};

export const getACOffset = async (height: number, width: number) => {
    const metadata = (await OBR.room.getMetadata()) as Metadata;
    const roomMetadata = metadata[metadataKey] as RoomMetadata;
    let offset = roomMetadata ? (roomMetadata.acOffset ?? { x: 0, y: 0 }) : { x: 0, y: 0 };
    offset.x = offset.x * (width / 150);
    offset.y = offset.y * (height / 150);
    return offset;
};

export const getAttachedItems = async (id: string, itemTypes: Array<string>) => {
    const items = await OBR.scene.items.getItemAttachments([id]);
    // why am I not using .filter()? because if I do there is a bug and I can't find it
    const attachments: Item[] = [];
    items.forEach((item) => {
        if (infoMetadataKey in item.metadata && itemTypes.indexOf(item.type) >= 0 && item.attachedTo === id) {
            attachments.push(item);
        }
    });

    return attachments;
};

export const calculatePercentage = async (data: HpTrackerMetadata) => {
    const metadata = (await OBR.room.getMetadata()) as Metadata;
    const roomMetadata = metadata[metadataKey] as RoomMetadata;
    const segments = roomMetadata ? (roomMetadata.hpBarSegments ?? 0) : 0;

    const tempHp = data.stats.tempHp ?? 0;

    const percentage = data.maxHp === 0 || data.hp === 0 || data.hp < 0 ? 0 : (data.hp - tempHp) / data.maxHp;
    const tempPercentage = data.maxHp === 0 || tempHp === 0 ? 0 : tempHp / data.maxHp;

    if (segments === 0) {
        return { hpPercentage: percentage, tempHpPercentage: tempPercentage };
    } else {
        const minStep = 100 / segments;
        const numStepsHp = Math.ceil((percentage * 100) / minStep);
        const numStepsTempHp = Math.ceil((tempPercentage * 100) / minStep);
        return { hpPercentage: (numStepsHp * minStep) / 100, tempHpPercentage: (numStepsTempHp * minStep) / 100 };
    }
};

export const getImageBounds = async (item: Image) => {
    const dpi = await OBR.scene.grid.getDpi();
    const dpiScale = dpi / item.grid.dpi;
    const width = item.image.width * dpiScale * item.scale.x;
    const height = item.image.height * dpiScale * item.scale.y;
    const offsetX = (item.grid.offset.x / item.image.width) * width;
    const offsetY = (item.grid.offset.y / item.image.height) * height;

    return {
        position: {
            x: item.position.x - offsetX,
            y: item.position.y - offsetY,
        },
        width: width,
        height: height,
    };
};

export const deleteAttachments = async (attachments: Item[]) => {
    if (attachments.length > 0) {
        await OBR.scene.items.deleteItems(attachments.map((attachment) => attachment.id));
    }
};

export const evalString = (s: string) => {
    const tokens = s.replace(/\s/g, "").match(/[+\-]?([0-9]+)/g) || [];

    // @ts-ignore this works but ts doesn't like it
    return tokens.reduce((sum: string, value: string) => parseFloat(sum) + parseFloat(value));
};

export const sortItems = (a: Item, b: Item) => {
    const aData = a.metadata[itemMetadataKey] as HpTrackerMetadata;
    const bData = b.metadata[itemMetadataKey] as HpTrackerMetadata;
    if (aData && bData && aData.index !== undefined && bData.index !== undefined) {
        if (aData.index < bData.index) {
            return -1;
        } else if (aData.index > bData.index) {
            return 1;
        } else {
            return 0;
        }
    }
    return 0;
};

export const sortItemsInitiative = (a: Item, b: Item) => {
    const aData = a.metadata[itemMetadataKey] as HpTrackerMetadata;
    const bData = b.metadata[itemMetadataKey] as HpTrackerMetadata;
    if (
        bData.initiative === aData.initiative &&
        !isUndefined(bData.stats.initiativeBonus) &&
        !isUndefined(aData.stats.initiativeBonus)
    ) {
        if (
            bData.stats.initiativeBonus === aData.stats.initiativeBonus &&
            !isUndefined(bData.index) &&
            !isUndefined(aData.index)
        ) {
            return aData.index - bData.index;
        }
        return bData.stats.initiativeBonus - aData.stats.initiativeBonus;
    }
    return bData.initiative - bData.initiative;
};

export const generateSlug = (string: string) => {
    let str = string.replace(/^\s+|\s+$/g, "");
    str = str.toLowerCase();
    str = str
        .replace(/[^a-z0-9 -]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

    return str;
};

export const getDamage = (text: string) => {
    const regex = /\d+d\d+/gi;
    const dice = regex.exec(text);

    return dice && dice.length > 0 ? dice[0] : null;
};

export const attachmentFilter = (attachment: Item, attachmentType: "BAR" | "HP" | "AC") => {
    if (infoMetadataKey in attachment.metadata) {
        const metadata = attachment.metadata[infoMetadataKey] as AttachmentMetadata;
        return metadata.isHpText && metadata.attachmentType === attachmentType;
    }
    return false;
};

export const getBgColor = (data: HpTrackerMetadata, opacity: string = "0.2") => {
    if (data.hp === 0 && data.maxHp === 0) {
        return "#1C1B22";
    }

    const percent = data.hp / (data.stats.tempHp ? data.stats.tempHp + data.maxHp : data.maxHp);

    const g = 255 * percent;
    const r = 255 - 255 * percent;
    return "rgb(" + r + "," + g + `,0,${opacity})`;
};

export const objectsEqual = (obj1: Object, obj2: Object) => {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
        return false;
    }

    // a forEach loop is not disrupted by a return
    for (const key of keys1) {
        // @ts-ignore obj1 has key
        const val1 = obj1[key];
        // @ts-ignore obj1 has key
        const val2 = obj2[key];

        const areObjects = isObject(val1) && isObject(val2);
        if ((areObjects && !objectsEqual(val1, val2)) || (!areObjects && val1 !== val2)) {
            return false;
        }
    }

    return true;
};

export const updateSceneMetadata = async (scene: SceneMetadata | null, data: Partial<SceneMetadata>) => {
    const ownMetadata: Metadata = {};
    ownMetadata[metadataKey] = { ...scene, ...data };

    if (!scene || !objectsEqual(ownMetadata, scene)) {
        await OBR.scene.setMetadata({ ...ownMetadata });
    }
};

export const updateRoomMetadata = async (
    room: RoomMetadata | null,
    data: Partial<RoomMetadata>,
    additionalData?: Metadata,
) => {
    const ownMetadata: Metadata = additionalData ?? {};
    ownMetadata[metadataKey] = { ...room, ...data };

    if (!room || !objectsEqual(ownMetadata, room)) {
        await OBR.room.setMetadata({ ...ownMetadata });
    }
};

export const dddiceRollToRollLog = async (
    roll: IRoll,
    options?: { participant?: IRoomParticipant; owlbear_user_id?: string },
): Promise<RollLogEntryType> => {
    let username = roll.external_id ?? roll.user.username;
    let participantName = "";
    if (options && options.participant && options.participant.username) {
        participantName = options.participant.username;
    } else {
        const particip = roll.room.participants.find((p) => p.user.uuid === roll.user.uuid);
        if (particip && particip.username) {
            participantName = particip.username;
        }
    }

    if (roll.user.name === "Guest User" && !roll.external_id) {
        username = participantName;
    }

    return {
        uuid: roll.uuid,
        created_at: roll.created_at,
        equation: roll.equation,
        label: roll.label,
        is_hidden: roll.values.some((v) => v.is_hidden),
        total_value: roll.total_value,
        username: username,
        values: roll.values.map((v) => {
            if (v.is_user_value) {
                return `+${String(v.value)}`;
            } else {
                return String(v.value);
            }
        }),
        owlbear_user_id: options?.owlbear_user_id,
        participantUsername: participantName,
    };
};

export const getRoomDiceUser = (room: RoomMetadata | null, id: string | null) => {
    return room?.diceUser?.find((user) => user.playerId === id);
};

const getLimitsE5 = (statblock: E5Statblock) => {
    const limits: Array<Limit> = [];

    const getActionTypeLimits = (actionType?: Array<Ability>) => {
        actionType?.forEach((action) => {
            if (action.limit) {
                limits.push({
                    id: action.limit.name,
                    max: action.limit.uses,
                    used: 0,
                    resets: action.limit.resets ?? [],
                });
            }
        });
    };

    getActionTypeLimits(statblock.actions);
    getActionTypeLimits(statblock.reactions);
    getActionTypeLimits(statblock.bonus_actions);
    getActionTypeLimits(statblock.special_abilities);
    getActionTypeLimits(statblock.lair_actions);
    getActionTypeLimits(statblock.mythic_actions);
    getActionTypeLimits(statblock.legendary_actions);

    statblock.spell_slots?.forEach((spellSlot) => {
        limits.push({
            id: spellSlot.limit.name,
            max: spellSlot.limit.uses,
            used: 0,
            resets: spellSlot.limit.resets ?? [],
        });
    });

    statblock.limits?.forEach((limit) => {
        limits.push({
            id: limit.name,
            max: limit.uses,
            used: 0,
            resets: limit.resets ?? [],
        });
    });

    return limits;
};

const getLimitsPf = (statblock: PfStatblock) => {
    if (!statblock) {
    }
    return [];
};

export const updateTokenSheet = (statblock: E5Statblock | PfStatblock, characterId: string, ruleset: "e5" | "pf") => {
    OBR.scene.items.updateItems([characterId], (items) => {
        items.forEach((item) => {
            const data = item.metadata[itemMetadataKey] as HpTrackerMetadata;
            const newValues =
                (data.stats.initial && data.sheet !== statblock.slug) ||
                (data.hp === 0 && data.maxHp === 0 && data.armorClass === 0);
            item.metadata[itemMetadataKey] = {
                ...data,
                sheet: statblock.slug,
                ruleset: ruleset,
                maxHp: newValues ? statblock.hp.value : data.hp,
                armorClass: newValues ? statblock.armor_class.value : data.armorClass,
                hp: newValues ? statblock.hp.value : data.hp,
                stats: {
                    ...data.stats,
                    initiativeBonus:
                        ruleset === "e5"
                            ? Math.floor((statblock.stats.dexterity - 10) / 2)
                            : parseInt(statblock.perception?.toString() ?? "0"),
                    initial: false,
                    limits:
                        ruleset === "e5"
                            ? getLimitsE5(statblock as E5Statblock)
                            : getLimitsPf(statblock as PfStatblock),
                },
            };
        });
    });
};

export const getSearchString = (name: string): string => {
    const nameParts = name.split(" ");
    const lastToken = nameParts[nameParts.length - 1];
    if (lastToken.length < 3 || /^\d+$/.test(lastToken) || /\d/.test(lastToken)) {
        return nameParts.slice(0, nameParts.length - 1).join(" ");
    }
    return name;
};

export const getInitialValues = async (items: Array<Image>) => {
    const roomData = await OBR.room.getMetadata();
    let ruleset = "e5";
    let apiKey = undefined;
    if (metadataKey in roomData) {
        const room = roomData[metadataKey] as RoomMetadata;
        ruleset = room.ruleset || "e5";
        apiKey = room.tabletopAlmanacAPIKey;
    }
    const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
    const itemInitValues: Record<string, InitialStatblockData> = {};

    axiosRetry(axios, {
        retries: 2,
        retryDelay: (_) => 200,
        retryCondition: (error) => error.message === "Network Error",
    });

    for (const item of items) {
        try {
            const name = getSearchString(getTokenName(item));
            if (!(itemMetadataKey in item.metadata)) {
                if (ruleset === "e5") {
                    const statblocks = await axios.request({
                        url: `${TTRPG_URL}/e5/statblock/search/`,
                        method: "GET",
                        headers: headers,
                        params: {
                            name: name,
                            take: 20,
                            skip: 0,
                        },
                    });
                    let bestMatch: { distance: number; statblock: InitialStatblockData } | undefined = undefined;
                    const diff = new diff_match_patch();
                    statblocks.data.forEach((statblock: E5Statblock) => {
                        const d = diff.diff_main(statblock.name, name);
                        const dist = diff.diff_levenshtein(d);
                        if (
                            bestMatch === undefined ||
                            dist < bestMatch.distance ||
                            (dist === bestMatch.distance && statblock.source === "wotc-srd")
                        ) {
                            bestMatch = {
                                distance: dist,
                                statblock: {
                                    hp: statblock.hp.value,
                                    ac: statblock.armor_class.value,
                                    bonus: Math.floor((statblock.stats.dexterity - 10) / 2),
                                    slug: statblock.slug,
                                    ruleset: "e5",
                                    limits: getLimitsE5(statblock),
                                },
                            };
                        }
                    });
                    if (bestMatch !== undefined) {
                        // @ts-ignore statblock exists on bestMatch;
                        itemInitValues[item.id] = bestMatch.statblock;
                    }
                } else if (ruleset === "pf") {
                    const statblocks = await axios.request({
                        url: `${TTRPG_URL}/pf/statblock/search/`,
                        method: "GET",
                        headers: headers,
                        params: {
                            name: name,
                            take: 10,
                            skip: 0,
                        },
                    });
                    let bestMatch: { distance: number; statblock: InitialStatblockData } | undefined = undefined;
                    const diff = new diff_match_patch();
                    statblocks.data.forEach((statblock: PfStatblock) => {
                        const d = diff.diff_main(statblock.name, name);
                        const dist = diff.diff_levenshtein(d);
                        if (bestMatch === undefined || dist < bestMatch.distance) {
                            bestMatch = {
                                distance: dist,
                                statblock: {
                                    hp: statblock.hp.value,
                                    ac: statblock.armor_class.value,
                                    bonus: statblock.perception
                                        ? parseInt(statblock.perception)
                                        : statblock.skills && "perception" in statblock.skills
                                          ? parseInt(statblock.skills["perception"] as string)
                                          : 0,
                                    slug: statblock.slug,
                                    ruleset: "pf",
                                    limits: getLimitsPf(statblock),
                                },
                            };
                        }
                    });
                    if (bestMatch !== undefined) {
                        // @ts-ignore statblock exists on bestMatch;
                        itemInitValues[item.id] = bestMatch.statblock;
                    }
                }
            }
        } catch {}
    }

    return itemInitValues;
};

export const updateLimit = async (itemId: string, limitValues: Limit) => {
    if (limitValues) {
        await OBR.scene.items.updateItems([itemId], (items) => {
            items.forEach((item) => {
                if (item) {
                    const metadata = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                    if (metadata) {
                        const index = metadata.stats.limits?.findIndex((l) => {
                            return l.id === limitValues.id;
                        });
                        if (index !== undefined) {
                            // @ts-ignore
                            item.metadata[itemMetadataKey]["stats"]["limits"][index]["used"] = Math.min(
                                limitValues.used + 1,
                                limitValues.max,
                            );
                        }
                    }
                }
            });
        });
    }
};

export const getTokenName = (token: Image) => {
    try {
        if (token.text && token.text.plainText && token.text.plainText.replaceAll(" ", "").length > 0) {
            return token.text.plainText;
        } else {
            return token.name;
        }
    } catch {
        return "";
    }
};

export const prepareTokenForGrimoire = async (contextItems: Array<Image>) => {
    const tokenIds: Array<string> = [];
    const itemStatblocks = await getInitialValues(contextItems as Array<Image>);
    await OBR.scene.items.updateItems(contextItems, (items) => {
        items.forEach((item) => {
            tokenIds.push(item.id);
            if (itemMetadataKey in item.metadata) {
                const metadata = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                metadata.hpTrackerActive = true;
                item.metadata[itemMetadataKey] = metadata;
            } else {
                // variable allows us to be typesafe
                const defaultMetadata: HpTrackerMetadata = {
                    hp: 0,
                    maxHp: 0,
                    armorClass: 0,
                    hpTrackerActive: true,
                    hpOnMap: false,
                    acOnMap: false,
                    hpBar: false,
                    initiative: 0,
                    sheet: "",
                    stats: {
                        initiativeBonus: 0,
                        initial: true,
                    },
                    playerMap: {
                        hp: false,
                        ac: false,
                    },
                };
                if (item.id in itemStatblocks) {
                    defaultMetadata.sheet = itemStatblocks[item.id].slug;
                    defaultMetadata.ruleset = itemStatblocks[item.id].ruleset;
                    defaultMetadata.maxHp = itemStatblocks[item.id].hp;
                    defaultMetadata.hp = itemStatblocks[item.id].hp;
                    defaultMetadata.armorClass = itemStatblocks[item.id].ac;
                    defaultMetadata.stats.initiativeBonus = itemStatblocks[item.id].bonus;
                    defaultMetadata.stats.initial = true;
                    defaultMetadata.stats.limits = itemStatblocks[item.id].limits;
                }
                item.metadata[itemMetadataKey] = defaultMetadata;
            }
        });
    });
    return tokenIds;
};
