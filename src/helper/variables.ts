import { Modal } from "@owlbear-rodeo/sdk/lib/types/Modal";
import { Popover } from "@owlbear-rodeo/sdk";
import { Stats } from "../components/general/DiceRoller/DiceButtonWrapper.tsx";
import { LootMetadata } from "./types.ts";

export const ID = "com.bitperfect-software.hp-tracker";
export const GMG_ID = "com.tabletop-almanac.gmg";
export const GMI_ID = "com.tabletop-almanac.gmi";
export const metadataKey = `${ID}/metadata`;
export const itemMetadataKey = `${ID}/data`;
export const infoMetadataKey = `${ID}/text`;
export const shopMetadataKey = `${GMI_ID}/shop`;
export const lootMetadataKey = `${GMI_ID}/loot`;

export const modalId = `${ID}/modal`;
export const diceTrayModalId = `${ID}/diceTrayModal`;
export const statblockPopoverId = `${ID}/statblock-popover`;
export const rollLogPopoverId = `${ID}/dice-log`;
export const shortRestPopoverId = `${ID}/short-rest`;
export const rollMessageChannel = `${ID}.roll-event`;
export const rollMessageWhisperChannel = `${ID}.roll-event-whisper`;
export const nextTurnChannel = `${ID}.next-turn`;

export const prettySordidID = "com.pretty-initiative";

export const dicePlusAvailableKey = `${GMG_ID}/dice-plus-available`;

export const version = "3.7.0";

export const changelogModal: Modal = {
    id: `${modalId}/changelog`,
    url: "/modal.html?content=changelog",
};

export const helpModal: Modal = {
    id: `${modalId}/help`,
    url: "/modal.html?content=help",
};

export const settingsModal: Modal = {
    id: `${modalId}/settings`,
    url: "/modal.html?content=settings",
};

export const diceModal: Modal = {
    id: `${modalId}/dice`,
    url: "/modal.html?content=dddice",
};

export const partyModal: Modal = {
    id: `${modalId}/party`,
    url: "/party.html",
};

export const lootModal: Modal = {
    id: `${modalId}/loot`,
    url: "/loot.html",
    width: 400,
    height: 600,
};

export const lootPopover: Popover = {
    id: `${modalId}/loot`,
    url: "/loot.html",
    width: 400,
    height: 600,
    transformOrigin: { vertical: "TOP", horizontal: "RIGHT" },
    marginThreshold: 10,
    anchorReference: "POSITION",
    disableClickAway: true,
};

export const diceTrayModal: Modal = {
    id: diceTrayModalId,
    url: "/modal.html?content=dicetray",
    fullScreen: true,
    hidePaper: true,
    hideBackdrop: true,
    disablePointerEvents: true,
};

export const rollLogPopover: Popover = {
    id: rollLogPopoverId,
    url: "/rolllog.html",
    width: 350,
    height: 200,
    anchorOrigin: { horizontal: "RIGHT", vertical: "BOTTOM" },
    transformOrigin: { vertical: "BOTTOM", horizontal: "RIGHT" },
    marginThreshold: 10,
    disableClickAway: true,
    hidePaper: true,
};

export const statblockPopover: Popover = {
    id: statblockPopoverId,
    url: "/statblock.html",
    width: 500,
    height: 600,
    transformOrigin: { vertical: "TOP", horizontal: "RIGHT" },
    marginThreshold: 10,
    anchorReference: "POSITION",
    disableClickAway: true,
};

export const defaultStats: Stats = {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    intelligence: 0,
    wisdom: 0,
    charisma: 0,
};

export const defaultLoot: LootMetadata = {
    lootAvailable: false,
    money: { cp: 0, sp: 0, ep: 0, gp: 0, pp: 0 },
    items: [],
};
