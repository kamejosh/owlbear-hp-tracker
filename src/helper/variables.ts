import { Modal } from "@owlbear-rodeo/sdk/lib/types/Modal";
import { Popover } from "@owlbear-rodeo/sdk";

export const ID = "com.bitperfect-software.hp-tracker";
export const metadataKey = `${ID}/metadata`;
export const itemMetadataKey = `${ID}/data`;
export const infoMetadataKey = `${ID}/text`;

export const modalId = `${ID}/modal`;
export const diceTrayModalId = `${ID}/diceTrayModal`;
export const statblockPopoverId = `${ID}/statblock-popover`;
export const rollLogPopoverId = `${ID}/dice-log`;

export const version = "2.1.0";

export const changelogModal: Modal = {
    id: modalId,
    url: "/modal.html?content=changelog",
};

export const helpModal: Modal = {
    id: modalId,
    url: "/modal.html?content=help",
};

export const settingsModal: Modal = {
    id: modalId,
    url: "/modal.html?content=settings",
};

export const diceModal: Modal = {
    id: modalId,
    url: "/modal.html?content=dddice",
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
