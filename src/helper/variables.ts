import { Modal } from "@owlbear-rodeo/sdk/lib/types/Modal";
import { Popover } from "@owlbear-rodeo/sdk";

export const ID = "com.bitperfect-software.hp-tracker";
export const sceneMetadata = `${ID}/metadata`;
export const characterMetadata = `${ID}/data`;
export const infoMetadata = `${ID}/text`;

export const modalId = `${ID}/modal`;
export const statblockPopoverId = `${ID}/statblock-popover`;

export const version = "1.5.1";

export const changelogModal: Modal = {
    id: modalId,
    url: "/modal.html?content=changelog",
    fullScreen: true,
};

export const helpModal: Modal = {
    id: modalId,
    url: "/modal.html?content=help",
    fullScreen: true,
};

export const settingsModal: Modal = {
    id: modalId,
    url: "/modal.html?content=settings",
    width: 400,
    height: 700,
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
