import { isNull, isUndefined } from "lodash";
import { Stats } from "../components/general/DiceRoller/DiceButtonWrapper.tsx";
import { useMetadataContext } from "../context/MetadataContext.ts";
import { Skills } from "./equipmentHelpers.ts";

export const replaceStatWithMod = (
    text: string,
    stats: Stats,
    skills?: Skills | null,
    proficiencyBonus?: number | null,
) => {
    const room = useMetadataContext.getState().room;

    if (room?.ruleset === "e5" && text.includes("PB")) {
        if (!isUndefined(proficiencyBonus) && !isNull(proficiencyBonus)) {
            text = text.replace("PB", proficiencyBonus.toString());
        } else {
            text = text.replace("PB", "0");
        }
    }
    if (room?.ruleset === "e5" && text.includes("SCM")) {
        text = text.replace(
            "SCM",
            Math.floor((Math.max(stats.intelligence, stats.wisdom, stats.charisma) - 10) / 2).toString(),
        );
    }
    if (text.includes("STR")) {
        text = text.replace(
            "STR",
            (room?.ruleset === "pf" ? stats.strength : Math.floor((stats.strength - 10) / 2)).toString(),
        );
    }
    if (text.includes("DEX")) {
        text = text.replace(
            "DEX",
            (room?.ruleset === "pf" ? stats.dexterity : Math.floor((stats.dexterity - 10) / 2)).toString(),
        );
    }
    if (text.includes("CON")) {
        text = text.replace(
            "CON",
            (room?.ruleset === "pf" ? stats.constitution : Math.floor((stats.constitution - 10) / 2)).toString(),
        );
    }
    if (text.includes("INT")) {
        text = text.replace(
            "INT",
            (room?.ruleset === "pf" ? stats.intelligence : Math.floor((stats.intelligence - 10) / 2)).toString(),
        );
    }
    if (text.includes("WIS")) {
        text = text.replace(
            "WIS",
            (room?.ruleset === "pf" ? stats.wisdom : Math.floor((stats.wisdom - 10) / 2)).toString(),
        );
    }
    if (text.includes("CHA")) {
        text = text.replace(
            "CHA",
            (room?.ruleset === "pf" ? stats.charisma : Math.floor((stats.charisma - 10) / 2)).toString(),
        );
    }
    if (room?.ruleset === "e5" && skills) {
        if (text.includes("ACR")) {
            text = text.replace("ACR", (skills.acrobatics ?? 0).toString());
        }
        if (text.includes("AHA")) {
            text = text.replace("AHA", (skills.animal_handling ?? 0).toString());
        }
        if (text.includes("ARC")) {
            text = text.replace("ARC", (skills.arcana ?? 0).toString());
        }
        if (text.includes("ATH")) {
            text = text.replace("ATH", (skills.athletics ?? 0).toString());
        }
        if (text.includes("DEC")) {
            text = text.replace("DEC", (skills.deception ?? 0).toString());
        }
        if (text.includes("HIS")) {
            text = text.replace("HIS", (skills.history ?? 0).toString());
        }
        if (text.includes("INS")) {
            text = text.replace("INS", (skills.insight ?? 0).toString());
        }
        if (text.includes("ITI")) {
            text = text.replace("ITI", (skills.intimidation ?? 0).toString());
        }
        if (text.includes("INV")) {
            text = text.replace("INV", (skills.investigation ?? 0).toString());
        }
        if (text.includes("MED")) {
            text = text.replace("MED", (skills.medicine ?? 0).toString());
        }
        if (text.includes("NAT")) {
            text = text.replace("NAT", (skills.nature ?? 0).toString());
        }
        if (text.includes("PER")) {
            text = text.replace("PRC", (skills.perception ?? 0).toString());
        }
        if (text.includes("PRF")) {
            text = text.replace("PRF", (skills.performance ?? 0).toString());
        }
        if (text.includes("PRS")) {
            text = text.replace("PRS", (skills.persuasion ?? 0).toString());
        }
        if (text.includes("REL")) {
            text = text.replace("REL", (skills.religion ?? 0).toString());
        }
        if (text.includes("SOH")) {
            text = text.replace("SOH", (skills.sleight_of_hand ?? 0).toString());
        }
        if (text.includes("STE")) {
            text = text.replace("STE", (skills.stealth ?? 0).toString());
        }
        if (text.includes("SUR")) {
            text = text.replace("SUR", (skills.survival ?? 0).toString());
        }
    }
    return text;
};
