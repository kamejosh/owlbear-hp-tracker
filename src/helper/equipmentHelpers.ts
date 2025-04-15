import { components } from "../api/schema";
import { LimitType } from "../components/gmgrimoire/statblocks/LimitComponent.tsx";
import { Ability } from "../components/gmgrimoire/statblocks/e5/E5Ability.tsx";
import { Stats } from "../components/general/DiceRoller/DiceButtonWrapper.tsx";
import { GMGMetadata } from "./types.ts";
import { updateTokenMetadata } from "./tokenHelper.ts";
import { updateHp } from "./hpHelpers.ts";
import { updateAc } from "./acHelper.ts";
import { E5Statblock } from "../api/e5/useE5Api.ts";
import { Item } from "@owlbear-rodeo/sdk";
import { isNull, isUndefined } from "lodash";

export type ItemOut = components["schemas"]["ItemOut"];
export type StatblockItems = components["schemas"]["StatblockItemOut"];
export type ItemSpell = components["schemas"]["ItemSpellOut"];
export type Speed = components["schemas"]["Speed"];
export type SavingThrows = components["schemas"]["src__model_types__e5__base__SavingThrows"];
export type Skills = components["schemas"]["Skills"];
export type Modifier = components["schemas"]["ModifierStats"];
export type ItemAC = components["schemas"]["ItemAC"];
export type StatblockStats = components["schemas"]["src__model_types__e5__base__Stats"];

export type StatblockBonuses = {
    spells: Array<{ itemId: number; spells: Array<ItemSpell> }>;
    hpBonus: number;
    ac: number;
    damageVulnerabilities: string;
    damageResistances: string;
    damageImmunities: string;
    conditionImmunities: string;
    senses: Array<string>;
    proficiencies: Array<string>;
    stats: Stats;
    speed: Speed;
    savingThrows: SavingThrows;
    skills: Skills;
};

export type ItemActions = {
    items: Array<{
        itemId: number;
        actions?: Array<Ability> | null;
        bonus_actions?: Array<Ability> | null;
        reactions?: Array<Ability> | null;
        special_abilities?: Array<Ability> | null;
    }>;
};

export type ItemCharges = {
    itemId: number;
    charges: LimitType | null;
};

export type EquipmentBonuses = {
    items: Array<ItemOut>;
    statblockBonuses: StatblockBonuses;
    itemActions: ItemActions;
    charges: Array<ItemCharges>;
    stats: Stats;
    ac: number | null;
};

const getStatValue = (stats: Stats, modifiers: Array<Modifier>): Stats => {
    const strengthMods = modifiers.filter((modifier) => modifier.stat_name === "strength");
    const dexterityMods = modifiers.filter((modifier) => modifier.stat_name === "dexterity");
    const constitutionMods = modifiers.filter((modifier) => modifier.stat_name === "constitution");
    const wisdomMods = modifiers.filter((modifier) => modifier.stat_name === "wisdom");
    const intelligenceMods = modifiers.filter((modifier) => modifier.stat_name === "intelligence");
    const charismaMods = modifiers.filter((modifier) => modifier.stat_name === "charisma");

    strengthMods.forEach((mod) => {
        if (mod.increase && mod.decrease) {
            stats.strength = mod.value;
        } else if (mod.increase && stats.strength < mod.value) {
            stats.strength = mod.value;
        } else if (mod.decrease && stats.strength > mod.value) {
            stats.strength = mod.value;
        }
    });
    dexterityMods.forEach((mod) => {
        if (mod.increase && mod.decrease) {
            stats.dexterity = mod.value;
        } else if (mod.increase && stats.dexterity < mod.value) {
            stats.dexterity = mod.value;
        } else if (mod.decrease && stats.dexterity > mod.value) {
            stats.dexterity = mod.value;
        }
    });
    constitutionMods.forEach((mod) => {
        if (mod.increase && mod.decrease) {
            stats.constitution = mod.value;
        } else if (mod.increase && stats.constitution < mod.value) {
            stats.constitution = mod.value;
        } else if (mod.decrease && stats.constitution > mod.value) {
            stats.constitution = mod.value;
        }
    });
    wisdomMods.forEach((mod) => {
        if (mod.increase && mod.decrease) {
            stats.wisdom = mod.value;
        } else if (mod.increase && stats.wisdom < mod.value) {
            stats.wisdom = mod.value;
        } else if (mod.decrease && stats.wisdom > mod.value) {
            stats.wisdom = mod.value;
        }
    });
    intelligenceMods.forEach((mod) => {
        if (mod.increase && mod.decrease) {
            stats.intelligence = mod.value;
        } else if (mod.increase && stats.intelligence < mod.value) {
            stats.intelligence = mod.value;
        } else if (mod.decrease && stats.intelligence > mod.value) {
            stats.intelligence = mod.value;
        }
    });
    charismaMods.forEach((mod) => {
        if (mod.increase && mod.decrease) {
            stats.charisma = mod.value;
        } else if (mod.increase && stats.charisma < mod.value) {
            stats.charisma = mod.value;
        } else if (mod.decrease && stats.charisma > mod.value) {
            stats.charisma = mod.value;
        }
    });
    return stats;
};

export const getEquipmentBonuses = (
    data: GMGMetadata,
    stats: StatblockStats,
    equipment: Array<StatblockItems>,
): EquipmentBonuses => {
    const bonuses: StatblockBonuses = {
        spells: [],
        hpBonus: 0,
        ac: 0,
        damageImmunities: "",
        damageResistances: "",
        damageVulnerabilities: "",
        conditionImmunities: "",
        senses: [],
        proficiencies: [],
        stats: {
            strength: 0,
            dexterity: 0,
            constitution: 0,
            wisdom: 0,
            intelligence: 0,
            charisma: 0,
        },
        speed: {
            walk: 0,
            fly: 0,
            swim: 0,
            climb: 0,
            burrow: 0,
            hover: 0,
            lightwalking: 0,
        },
        savingThrows: {
            strength_save: 0,
            dexterity_save: 0,
            constitution_save: 0,
            wisdom_save: 0,
            intelligence_save: 0,
            charisma_save: 0,
        },
        skills: {
            acrobatics: 0,
            animal_handling: 0,
            arcana: 0,
            athletics: 0,
            deception: 0,
            history: 0,
            insight: 0,
            intimidation: 0,
            investigation: 0,
            medicine: 0,
            nature: 0,
            perception: 0,
            performance: 0,
            persuasion: 0,
            religion: 0,
            sleight_of_hand: 0,
            stealth: 0,
            survival: 0,
        },
    };
    const actions: ItemActions = {
        items: [],
    };
    const itemACs: Array<number> = [];
    const charges: Array<ItemCharges> = [];
    const modifiers: Array<Modifier> = [];

    equipment?.forEach((item) => {
        if (isItemAttuned(data, item) || isItemEquipped(data, item)) {
            if (item.item.spells) {
                bonuses.spells.push({ itemId: item.item.id, spells: item.item.spells });
            }
            if (item.item.ac) {
                let acValue = item.item.ac.value;
                if (!isNull(item.item.ac.max_dex) && !isUndefined(item.item.ac.max_dex) && stats.dexterity) {
                    acValue += Math.min(item.item.ac.max_dex, Math.floor((stats.dexterity - 10) / 2));
                } else if (isNull(item.item.ac.max_dex) && stats.dexterity) {
                    acValue += Math.floor((stats.dexterity - 10) / 2);
                }
                itemACs.push(acValue);
            }
            if (item.item.bonus) {
                const itemBonus = item.item.bonus;

                if (itemBonus.hp) {
                    bonuses.hpBonus += itemBonus.hp;
                }
                if (itemBonus.armor_class) {
                    bonuses.ac += itemBonus.armor_class;
                }
                if (itemBonus.damage_vulnerabilities) {
                    bonuses.damageVulnerabilities += ` ${itemBonus.damage_vulnerabilities}`;
                }
                if (itemBonus.damage_resistances) {
                    bonuses.damageResistances += ` ${itemBonus.damage_resistances}`;
                }
                if (itemBonus.damage_immunities) {
                    bonuses.damageImmunities += ` ${itemBonus.damage_immunities}`;
                }
                if (itemBonus.condition_immunities) {
                    bonuses.conditionImmunities += ` ${itemBonus.condition_immunities}`;
                }
                if (itemBonus.senses) {
                    bonuses.senses = bonuses.senses.concat(...itemBonus.senses);
                }
                if (itemBonus.proficiency) {
                    bonuses.proficiencies = bonuses.proficiencies.concat(...itemBonus.proficiency);
                }
                if (itemBonus.stats) {
                    if (itemBonus.stats.strength) {
                        bonuses.stats.strength += itemBonus.stats.strength;
                    }
                    if (itemBonus.stats.dexterity) {
                        bonuses.stats.dexterity += itemBonus.stats.dexterity;
                    }
                    if (itemBonus.stats.constitution) {
                        bonuses.stats.constitution += itemBonus.stats.constitution;
                    }
                    if (itemBonus.stats.wisdom) {
                        bonuses.stats.wisdom += itemBonus.stats.wisdom;
                    }
                    if (itemBonus.stats.intelligence) {
                        bonuses.stats.intelligence += itemBonus.stats.intelligence;
                    }
                    if (itemBonus.stats.charisma) {
                        bonuses.stats.charisma += itemBonus.stats.charisma;
                    }
                }
                if (itemBonus.speed) {
                    if (itemBonus.speed.walk) {
                        bonuses.speed.walk = (bonuses.speed.walk || 0) + itemBonus.speed.walk;
                    }
                    if (itemBonus.speed.fly) {
                        bonuses.speed.fly = (bonuses.speed.fly || 0) + itemBonus.speed.fly;
                    }
                    if (itemBonus.speed.swim) {
                        bonuses.speed.swim = (bonuses.speed.swim || 0) + itemBonus.speed.swim;
                    }
                    if (itemBonus.speed.climb) {
                        bonuses.speed.climb = (bonuses.speed.climb || 0) + itemBonus.speed.climb;
                    }
                    if (itemBonus.speed.burrow) {
                        bonuses.speed.burrow = (bonuses.speed.burrow || 0) + itemBonus.speed.burrow;
                    }
                    if (itemBonus.speed.hover) {
                        bonuses.speed.hover = (bonuses.speed.hover || 0) + itemBonus.speed.hover;
                    }
                    if (itemBonus.speed.lightwalking) {
                        bonuses.speed.lightwalking = (bonuses.speed.lightwalking || 0) + itemBonus.speed.lightwalking;
                    }
                }
                if (itemBonus.saving_throws) {
                    if (itemBonus.saving_throws.strength_save) {
                        bonuses.savingThrows.strength_save =
                            (bonuses.savingThrows.strength_save || 0) + itemBonus.saving_throws.strength_save;
                    }
                    if (itemBonus.saving_throws.dexterity_save) {
                        bonuses.savingThrows.dexterity_save =
                            (bonuses.savingThrows.dexterity_save || 0) + itemBonus.saving_throws.dexterity_save;
                    }
                    if (itemBonus.saving_throws.constitution_save) {
                        bonuses.savingThrows.constitution_save =
                            (bonuses.savingThrows.constitution_save || 0) + itemBonus.saving_throws.constitution_save;
                    }
                    if (itemBonus.saving_throws.wisdom_save) {
                        bonuses.savingThrows.wisdom_save =
                            (bonuses.savingThrows.wisdom_save || 0) + itemBonus.saving_throws.wisdom_save;
                    }
                    if (itemBonus.saving_throws.intelligence_save) {
                        bonuses.savingThrows.intelligence_save =
                            (bonuses.savingThrows.intelligence_save || 0) + itemBonus.saving_throws.intelligence_save;
                    }
                    if (itemBonus.saving_throws.charisma_save) {
                        bonuses.savingThrows.charisma_save =
                            (bonuses.savingThrows.charisma_save || 0) + itemBonus.saving_throws.charisma_save;
                    }
                }
                if (itemBonus.skills) {
                    if (itemBonus.skills.acrobatics) {
                        bonuses.skills.acrobatics = itemBonus.skills.acrobatics;
                    }
                    if (itemBonus.skills.animal_handling) {
                        bonuses.skills.animal_handling = itemBonus.skills.animal_handling;
                    }
                    if (itemBonus.skills.arcana) {
                        bonuses.skills.arcana = itemBonus.skills.arcana;
                    }
                    if (itemBonus.skills.athletics) {
                        bonuses.skills.athletics = itemBonus.skills.athletics;
                    }
                    if (itemBonus.skills.deception) {
                        bonuses.skills.deception = itemBonus.skills.deception;
                    }
                    if (itemBonus.skills.history) {
                        bonuses.skills.history = itemBonus.skills.history;
                    }
                    if (itemBonus.skills.insight) {
                        bonuses.skills.insight = itemBonus.skills.insight;
                    }
                    if (itemBonus.skills.intimidation) {
                        bonuses.skills.intimidation = itemBonus.skills.intimidation;
                    }
                    if (itemBonus.skills.investigation) {
                        bonuses.skills.investigation = itemBonus.skills.investigation;
                    }
                    if (itemBonus.skills.medicine) {
                        bonuses.skills.medicine = itemBonus.skills.medicine;
                    }
                    if (itemBonus.skills.nature) {
                        bonuses.skills.nature = itemBonus.skills.nature;
                    }
                    if (itemBonus.skills.perception) {
                        bonuses.skills.perception = itemBonus.skills.perception;
                    }
                    if (itemBonus.skills.performance) {
                        bonuses.skills.performance = itemBonus.skills.performance;
                    }
                    if (itemBonus.skills.persuasion) {
                        bonuses.skills.persuasion = itemBonus.skills.persuasion;
                    }
                    if (itemBonus.skills.religion) {
                        bonuses.skills.religion = itemBonus.skills.religion;
                    }
                    if (itemBonus.skills.sleight_of_hand) {
                        bonuses.skills.sleight_of_hand = itemBonus.skills.sleight_of_hand;
                    }
                    if (itemBonus.skills.stealth) {
                        bonuses.skills.stealth = itemBonus.skills.stealth;
                    }
                    if (itemBonus.skills.survival) {
                        bonuses.skills.survival = itemBonus.skills.survival;
                    }
                }
            }
            item.item.modifiers?.stats?.forEach((modifier) => {
                modifiers.push(modifier);
            });
        }

        if (isItemEquipped(data, item) && item.item.bonus) {
            actions.items.push({
                itemId: item.item.id,
                actions: item.item.bonus.actions,
                bonus_actions: item.item.bonus.bonus_actions,
                reactions: item.item.bonus.reactions,
                special_abilities: item.item.bonus.special_abilities,
            });
        }

        if (item.item.charges) {
            charges.push({ itemId: item.item.id, charges: item.item.charges });
        }
    });

    const totalStats = getStatValue(
        {
            strength: (stats.strength || 0) + bonuses.stats.strength,
            dexterity: (stats.dexterity || 0) + bonuses.stats.dexterity,
            constitution: (stats.constitution || 0) + bonuses.stats.constitution,
            wisdom: (stats.wisdom || 0) + bonuses.stats.wisdom,
            intelligence: (stats.intelligence || 0) + bonuses.stats.intelligence,
            charisma: (stats.charisma || 0) + bonuses.stats.charisma,
        },
        modifiers,
    );

    return {
        items: equipment.map((e) => e.item),
        statblockBonuses: bonuses,
        itemActions: actions,
        charges: charges,
        stats: totalStats,
        ac: itemACs.length === 0 ? null : Math.max(...itemACs),
    };
};

export const isItemInUse = (data: GMGMetadata, item: StatblockItems) => {
    if (
        item.item.requires_attuning &&
        data.equipment?.attuned.includes(item.item.slug) &&
        data.equipment?.equipped.includes(item.item.slug)
    ) {
        return true;
    } else if (
        !item.item.requires_attuning &&
        item.item.can_equip &&
        data.equipment?.equipped.includes(item.item.slug)
    ) {
        return true;
    } else if (!item.item.requires_attuning && !item.item.can_equip) {
        return true;
    }
    return false;
};

export const isItemEquipped = (data: GMGMetadata, item: StatblockItems) => {
    return !!(item.item.can_equip && data.equipment?.equipped.includes(item.item.slug));
};

export const isItemAttuned = (data: GMGMetadata, item: StatblockItems) => {
    return !!(item.item.requires_attuning && data.equipment?.attuned.includes(item.item.slug));
};

export const handleEquipmentChange = async (
    data: GMGMetadata,
    equipped: Array<string>,
    attuned: Array<string>,
    statblock: E5Statblock,
    item: Item,
) => {
    const newData = {
        ...data,
        equipment: { equipped: equipped, attuned: attuned },
    };
    if (statblock.equipment) {
        const equipmentBonus = getEquipmentBonuses(newData, statblock.stats, statblock.equipment);
        newData.maxHp = Number(statblock.hp.value) + Number(equipmentBonus.statblockBonuses.hpBonus);
        newData.hp = Math.min(newData.hp, newData.maxHp);
        const combinedAC = equipmentBonus.ac || statblock.armor_class.value;

        newData.armorClass = combinedAC + equipmentBonus.statblockBonuses.ac;
        newData.stats.initiativeBonus = statblock.initiative ?? Math.floor((equipmentBonus.stats.dexterity - 10) / 2);
    }
    await updateTokenMetadata(newData, [item.id]);
    await updateHp(item, newData);
    await updateAc(item, newData);
};
