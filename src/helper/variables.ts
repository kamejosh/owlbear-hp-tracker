import { Modal } from "@owlbear-rodeo/sdk/lib/types/Modal";

export const ID = "com.bitperfect-software.hp-tracker";
export const sceneMetadata = `${ID}/metadata`;
export const characterMetadata = `${ID}/data`;
export const infoMetadata = `${ID}/text`;

export const modalId = `${ID}/modal`;
export const version = "1.4.2";

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
    height: 600,
};
