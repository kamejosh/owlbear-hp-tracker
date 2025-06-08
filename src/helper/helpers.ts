import OBR, { Image, Item, Metadata } from "@owlbear-rodeo/sdk";
import { infoMetadataKey, itemMetadataKey, metadataKey } from "./variables.ts";
import {
    AttachmentMetadata,
    BestMatch,
    GMGMetadata,
    InitialStatblockData,
    Limit,
    RoomMetadata,
    SceneMetadata,
} from "./types.ts";
import { isEqual, isNull, isObject, isUndefined } from "lodash";
import { IRoll, IRoomParticipant } from "dddice-js";
import { RollLogEntryType } from "../context/RollLogContext.tsx";
import { TTRPG_URL } from "../config.ts";
import axios from "axios";
import diff_match_patch from "./diff/diff_match_patch.ts";
import { E5Statblock } from "../api/e5/useE5Api.ts";
import { PfStatblock } from "../api/pf/usePfApi.ts";
import axiosRetry from "axios-retry";
import { Ability } from "../components/gmgrimoire/statblocks/e5/E5Ability.tsx";
import { chunk } from "lodash";
import { deleteItems, updateItems } from "./obrHelper.ts";
import { getEquipmentBonuses } from "./equipmentHelpers.ts";
import { UserSettings } from "../api/tabletop-almanac/useUser.ts";
import { updateHp } from "./hpHelpers.ts";
import { updateAc } from "./acHelper.ts";

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

export const calculatePercentage = async (data: GMGMetadata) => {
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
        await deleteItems(attachments.map((attachment) => attachment.id));
    }
};

export const evalString = (s: string) => {
    const tokens = s.replace(/\s/g, "").match(/[+\-]?([0-9]+)/g) || [];

    // @ts-ignore this works but ts doesn't like it
    return tokens.reduce((sum: string, value: string) => parseFloat(sum) + parseFloat(value));
};

export const sortItems = (a: Item, b: Item) => {
    const aData = a.metadata[itemMetadataKey] as GMGMetadata;
    const bData = b.metadata[itemMetadataKey] as GMGMetadata;
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

/**
 * This function is used to determine the order of Items in the player view and in the Battle Tracker
 * It compares the index of the tokens to match the current order in the GM View.
 *
 * This function must not be used to order the Tokens in the GM view because in case Initiative order is reversed the index compare will always trigger a reorder
 * @param a
 * @param b
 */
export const sortItemsInitiative = (a: Item, b: Item) => {
    const aData = a.metadata[itemMetadataKey] as GMGMetadata;
    const bData = b.metadata[itemMetadataKey] as GMGMetadata;
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
    return bData.initiative - aData.initiative;
};

/**
 * This function is used to determine the order of Items in the GM view it compares initiative and initiative bonus but doesn't look at the index because in case to items have the same value the index in the GM view does not matter.
 *
 * This function must not be used to order the Tokens in the player view or the battle tracker because it might lead to a reverse order of tokens based on index
 * @param a
 * @param b
 * @param reverse
 */
export const sortByInitiative = (a: Item, b: Item, reverse: boolean) => {
    const aData = a.metadata[itemMetadataKey] as GMGMetadata;
    const bData = b.metadata[itemMetadataKey] as GMGMetadata;
    if (
        bData.initiative === aData.initiative &&
        !isUndefined(bData.stats.initiativeBonus) &&
        !isUndefined(aData.stats.initiativeBonus)
    ) {
        if (reverse) {
            return aData.stats.initiativeBonus - bData.stats.initiativeBonus;
        } else {
            return bData.stats.initiativeBonus - aData.stats.initiativeBonus;
        }
    }
    if (reverse) {
        return aData.initiative - bData.initiative;
    } else {
        return bData.initiative - aData.initiative;
    }
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

export const getBgColor = (
    data: GMGMetadata,
    opacity: string = "0.2",
    disable: boolean = false,
    color: string = "#1C1B22",
) => {
    if ((data.hp === 0 && data.maxHp === 0) || disable) {
        return color;
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

    if (!scene || !objectsEqual({ ...scene, ...data }, scene)) {
        await OBR.scene.setMetadata({ ...ownMetadata });
    }
};

export const updateRoomMetadata = async (
    room: RoomMetadata | null,
    data: Partial<RoomMetadata>,
    additionalData?: Metadata,
    force: boolean = false,
) => {
    const ownMetadata: Metadata = additionalData ?? {};
    ownMetadata[metadataKey] = { ...room, ...data };

    if (!room || !objectsEqual({ ...room, ...data }, room) || force) {
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

    if ((roll.user.name === "Guest User" && !roll.external_id) || username.includes("dndb")) {
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

    getActionTypeLimits(statblock.actions || []);
    getActionTypeLimits(statblock.reactions || []);
    getActionTypeLimits(statblock.bonus_actions || []);
    getActionTypeLimits(statblock.special_abilities || []);
    getActionTypeLimits(statblock.lair_actions || []);
    getActionTypeLimits(statblock.mythic_actions || []);
    getActionTypeLimits(statblock.legendary_actions || []);

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

    statblock.equipment?.forEach((equipment) => {
        if (equipment.item.charges) {
            limits.push({
                id: equipment.item.charges.name,
                max: equipment.item.charges.uses,
                used: 0,
                resets: equipment.item.charges.resets ?? [],
            });
        }
        getActionTypeLimits(equipment.item.bonus?.actions || []);
        getActionTypeLimits(equipment.item.bonus?.bonus_actions || []);
        getActionTypeLimits(equipment.item.bonus?.reactions || []);
        getActionTypeLimits(equipment.item.bonus?.special_abilities || []);
    });

    if (statblock.hp.hit_dice) {
        try {
            const hitDice = statblock.hp.hit_dice.split("d");
            const dice = parseInt(hitDice[0]);
            limits.push({
                id: "Hit Dice",
                max: dice,
                used: 0,
                resets: ["Long Rest"],
            });
        } catch {}
    }
    const uniqueLimits: Array<Limit> = [];
    limits.forEach((limit) => {
        const foundLimit = uniqueLimits.find((l) => l.id === limit.id);
        if (foundLimit) {
            if (limit.max > foundLimit.max) {
                uniqueLimits.splice(
                    uniqueLimits.findIndex((l) => l.id === limit.id),
                    1,
                    limit,
                );
            }
        } else {
            uniqueLimits.push(limit);
        }
    });
    return uniqueLimits;
};

const getLimitsPf = (statblock: PfStatblock) => {
    if (!statblock) {
    }
    return [];
};

const getPfInitiativeBonus = (bonus?: string | null) => {
    if (bonus) {
        try {
            return parseInt(bonus);
        } catch {}
    }
    return 0;
};

export const updateTokenSheet = async (
    statblock: E5Statblock | PfStatblock,
    characterId: string,
    ruleset: "e5" | "pf",
) => {
    await updateItems([characterId], (items) => {
        items.forEach((item) => {
            const data = item.metadata[itemMetadataKey] as GMGMetadata;
            const newValues =
                (data.stats.initial && data.sheet !== statblock.slug) ||
                (data.hp === 0 && data.maxHp === 0 && data.armorClass === 0);
            const equipmentData: { equipped: Array<string>; attuned: Array<string> } = { equipped: [], attuned: [] };
            let newHP,
                newAC = 0;
            if (ruleset === "e5") {
                const e5Statblock = statblock as E5Statblock;
                equipmentData.equipped = e5Statblock.equipment?.filter((e) => e.equipped).map((e) => e.item.slug) || [];
                equipmentData.attuned = e5Statblock.equipment?.filter((e) => e.attuned).map((e) => e.item.slug) || [];
                const equipmentBonuses = getEquipmentBonuses(
                    // we only need the equipment data in this function
                    { equipment: equipmentData } as GMGMetadata,
                    e5Statblock.stats,
                    e5Statblock.equipment || [],
                );

                const combinedAC = equipmentBonuses.ac || statblock.armor_class.value;
                newHP = statblock.hp.value + equipmentBonuses.statblockBonuses.hpBonus;
                newAC = combinedAC + equipmentBonuses.statblockBonuses.ac;
            } else {
                newHP = statblock.hp.value;
                newAC = statblock.armor_class.value;
            }
            item.metadata[itemMetadataKey] = {
                ...data,
                sheet: statblock.slug,
                ruleset: ruleset,
                maxHp: newValues ? newHP : data.hp,
                armorClass: newValues ? newAC : data.armorClass,
                hp: newValues ? newHP : data.hp,
                equipment: equipmentData,
                stats: {
                    ...data.stats,
                    initiativeBonus:
                        ruleset === "e5"
                            ? (statblock as E5Statblock).initiative ||
                              Math.floor(((statblock.stats.dexterity || 0) - 10) / 2)
                            : getPfInitiativeBonus((statblock as PfStatblock).perception),
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

export const resyncToken = async (statblock: E5Statblock | PfStatblock, characterId: string, ruleset: "e5" | "pf") => {
    await updateItems([characterId], (items) => {
        items.forEach((item) => {
            const data = item.metadata[itemMetadataKey] as GMGMetadata;
            const equipmentData: { equipped: Array<string>; attuned: Array<string> } = { equipped: [], attuned: [] };
            let newHP,
                newAC = 0;
            if (ruleset === "e5") {
                const e5Statblock = statblock as E5Statblock;
                equipmentData.equipped =
                    e5Statblock.equipment
                        ?.filter((e) => e.equipped || data.equipment?.equipped.includes(e.item.slug))
                        .map((e) => e.item.slug) || [];
                equipmentData.attuned =
                    e5Statblock.equipment
                        ?.filter((e) => e.attuned || data.equipment?.attuned.includes(e.item.slug))
                        .map((e) => e.item.slug) || [];
                const equipmentBonuses = getEquipmentBonuses(
                    // we only need the equipment data in this function
                    { equipment: equipmentData } as GMGMetadata,
                    e5Statblock.stats,
                    e5Statblock.equipment || [],
                );
                const combinedAC = equipmentBonuses.ac || statblock.armor_class.value;
                newHP = statblock.hp.value + equipmentBonuses.statblockBonuses.hpBonus;
                newAC = combinedAC + equipmentBonuses.statblockBonuses.ac;
            } else {
                newHP = statblock.hp.value;
                newAC = statblock.armor_class.value;
            }
            item.metadata[itemMetadataKey] = {
                ...data,
                sheet: statblock.slug,
                ruleset: ruleset,
                maxHp: newHP,
                armorClass: newAC,
                hp: data.hp === data.maxHp ? newHP : Math.min(data.hp, newHP),
                equipment: equipmentData,
                stats: {
                    ...data.stats,
                    initiativeBonus:
                        ruleset === "e5"
                            ? (statblock as E5Statblock).initiative ||
                              Math.floor(((statblock.stats.dexterity || 0) - 10) / 2)
                            : getPfInitiativeBonus((statblock as PfStatblock).perception),
                    initial: false,
                    limits:
                        ruleset === "e5"
                            ? getLimitsE5(statblock as E5Statblock)
                                  .map((limit) => {
                                      const current = data.stats.limits?.find((l) => l.id === limit.id);
                                      if (current) {
                                          return { ...limit, used: Math.min(current.used, limit.max) };
                                      }
                                      return limit;
                                  })
                                  .filter((e) => !isNull(e))
                            : getLimitsPf(statblock as PfStatblock),
                },
            };
        });
    });
    const items = await OBR.scene.items.getItems([characterId]);
    items.forEach((item) => {
        const data = item.metadata[itemMetadataKey] as GMGMetadata;
        updateHp(item, data);
        updateAc(item, data);
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

export const getTASettings = async (): Promise<UserSettings | null> => {
    const roomData = await OBR.room.getMetadata();
    let apiKey = undefined;
    if (metadataKey in roomData) {
        const room = roomData[metadataKey] as RoomMetadata;
        apiKey = room.tabletopAlmanacAPIKey;
        if (apiKey) {
            const headers = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};
            axiosRetry(axios, {
                retries: 2,
                retryDelay: (_) => 200,
                retryCondition: (error) => error.message === "Network Error",
            });

            try {
                const response = await axios.request({
                    url: `${TTRPG_URL}/users/me/settings`,
                    method: "GET",
                    headers: headers,
                });
                if (response.status === 200) {
                    return response.data;
                }
            } catch {
                return null;
            }
        }
    }
    return null;
};

export const getInitialValues = async (items: Array<Image>, getDarkVision: boolean = false) => {
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
    const srdSources = ["cc", "menagerie", "ta", "tob", "tob3", "wotc14", "wotc24"];

    const isBestMatch = (dist: number, statblock: E5Statblock, bestMatch?: BestMatch): boolean => {
        if (bestMatch === undefined) {
            return true;
        } else if (dist < bestMatch.distance) {
            return true;
        } else if (dist === bestMatch.distance) {
            if (statblock.source) {
                if (!srdSources.includes(statblock.source)) {
                    return true;
                } else if (
                    (bestMatch.source && srdSources.includes(bestMatch.source) && statblock.source === "wotc14") ||
                    statblock.source === "wotc24"
                ) {
                    if (bestMatch.source === "wotc24" && statblock.source === "wotc14") {
                        return false;
                    } else {
                        return true;
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        } else {
            return false;
        }
    };

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
                            search_string: name,
                            take: 20,
                            skip: 0,
                        },
                    });
                    let bestMatch: BestMatch | undefined = undefined;
                    const diff = new diff_match_patch();
                    statblocks.data.forEach((statblock: E5Statblock) => {
                        const d = diff.diff_main(statblock.name, name);
                        const dist = diff.diff_levenshtein(d);
                        if (isBestMatch(dist, statblock, bestMatch)) {
                            const equipmentData = {
                                equipped: statblock.equipment?.filter((e) => e.equipped).map((e) => e.item.slug) || [],
                                attuned: statblock.equipment?.filter((e) => e.attuned).map((e) => e.item.slug) || [],
                            };
                            const equipmentBonuses = getEquipmentBonuses(
                                // we only need the equipment data in this function
                                { equipment: equipmentData } as GMGMetadata,
                                statblock.stats,
                                statblock.equipment || [],
                            );

                            const combinedAC = equipmentBonuses.ac || statblock.armor_class.value;

                            bestMatch = {
                                source: statblock.source,
                                distance: dist,
                                statblock: {
                                    hp: statblock.hp.value + equipmentBonuses.statblockBonuses.hpBonus,
                                    ac: combinedAC + equipmentBonuses.statblockBonuses.ac,
                                    bonus:
                                        statblock.initiative ?? Math.floor((equipmentBonuses.stats.dexterity - 10) / 2),
                                    slug: statblock.slug,
                                    ruleset: "e5",
                                    limits: getLimitsE5(statblock),
                                    equipment: equipmentData,
                                    darkvision: getDarkVision
                                        ? Number(
                                              statblock.senses
                                                  ?.find((s) => s.toLowerCase().includes("darkvision"))
                                                  ?.replace(/\D/g, ""),
                                          )
                                        : null,
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
                        if (
                            bestMatch === undefined ||
                            dist < bestMatch.distance ||
                            (dist === bestMatch.distance && statblock.source !== null)
                        ) {
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
                                    darkvision: null,
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
        } catch (e) {
            console.error(e);
        }
    }

    return itemInitValues;
};

export const updateLimit = async (itemId: string, limitValues: Limit, usage?: number) => {
    if (limitValues) {
        await updateItems([itemId], (items) => {
            items.forEach((item) => {
                if (item) {
                    const metadata = item.metadata[itemMetadataKey] as GMGMetadata;
                    if (metadata) {
                        const index = metadata.stats.limits?.findIndex((l) => {
                            return l.id === limitValues.id;
                        });
                        if (index !== undefined) {
                            // @ts-ignore
                            item.metadata[itemMetadataKey]["stats"]["limits"][index]["used"] = Math.min(
                                limitValues.used + (isUndefined(usage) ? 1 : usage),
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
    const settings = await getTASettings();
    const itemStatblocks = await getInitialValues(contextItems as Array<Image>, settings?.assign_ss_darkvision);
    await updateItems(
        contextItems.map((i) => i.id),
        (items) => {
            items.forEach((item) => {
                tokenIds.push(item.id);
                if (itemMetadataKey in item.metadata) {
                    const metadata = item.metadata[itemMetadataKey] as GMGMetadata;
                    metadata.hpTrackerActive = true;
                    item.metadata[itemMetadataKey] = metadata;
                } else {
                    // variable allows us to be typesafe
                    const defaultMetadata: GMGMetadata = {
                        hp: 0,
                        maxHp: 0,
                        armorClass: 0,
                        hpTrackerActive: true,
                        hpOnMap: settings?.default_token_settings?.hpOnMap || false,
                        acOnMap: settings?.default_token_settings?.acOnMap || false,
                        hpBar: settings?.default_token_settings?.hpOnMap || false,
                        initiative: 0,
                        sheet: "",
                        stats: {
                            initiativeBonus: 0,
                            initial: true,
                        },
                        playerMap: {
                            hp: settings?.default_token_settings?.playerMap?.hp || false,
                            ac: settings?.default_token_settings?.playerMap?.ac || false,
                        },
                        playerList: settings?.default_token_settings?.playerList || false,
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
                        defaultMetadata.equipment = itemStatblocks[item.id].equipment;
                    }
                    item.metadata[itemMetadataKey] = defaultMetadata;
                    if (settings?.assign_ss_darkvision && itemStatblocks[item.id]?.darkvision) {
                        item.metadata["com.battle-system.smoke/visionDark"] = String(
                            itemStatblocks[item.id].darkvision,
                        );
                        item.metadata["com.battle-system.smoke/visionRange"] = String(
                            itemStatblocks[item.id].darkvision,
                        );
                    }
                }
            });
        },
    );
    return tokenIds;
};

export const reorderMetadataIndex = async (list: Array<Image>, group?: string) => {
    const chunks = chunk(list, 12);
    let index = 0;
    for (const subList of chunks) {
        try {
            await updateItems(
                subList.map((i) => i.id),
                (items) => {
                    items.forEach((item) => {
                        const data = item.metadata[itemMetadataKey] as GMGMetadata;
                        data.index = index;
                        if (group) {
                            data.group = group;
                        }
                        index++;
                        item.metadata[itemMetadataKey] = { ...data };
                    });
                },
            );
        } catch (e) {
            const errorName =
                isObject(e) && "error" in e && isObject(e.error) && "name" in e.error
                    ? e.error.name
                    : "Undefined Error";
            console.warn(`GM's Grimoire: Error while updating reordering ${subList.length} tokens: ${errorName}`);
        }
    }
};

export const orderByInitiative = async (tokenMap: Map<string, Array<Image>>, reverse: boolean = false) => {
    const groups = tokenMap.values();

    for (const group of groups) {
        const reordered = Array.from(group);
        reordered.sort((a, b) => sortByInitiative(a, b, reverse));
        if (!isEqual(group, reordered)) {
            await reorderMetadataIndex(reordered);
        }
    }
};
export const modulo = (n: number, m: number) => {
    return ((n % m) + m) % m;
};

export const delay = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};
