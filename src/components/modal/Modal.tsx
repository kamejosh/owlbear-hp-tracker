import { ContextWrapper } from "../ContextWrapper.tsx";
import { Help } from "./Components/Help.tsx";
import { Changelog } from "./Components/Changelog.tsx";
import OBR from "@owlbear-rodeo/sdk";
import { diceTrayModalId, modalId } from "../../helper/variables.ts";
import { Settings } from "./Components/Settings.tsx";
import { DiceLogin } from "./Components/DiceLogin.tsx";
import { DiceTray } from "../general/DiceRoller/DiceTray.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useShallow } from "zustand/react/shallow";
import { getRoomDiceUser } from "../../helper/helpers.ts";

export const Modal = () => {
    return (
        <ContextWrapper component={"modal"}>
            <Content />
        </ContextWrapper>
    );
};

const Content = () => {
    const content = new URLSearchParams(window.location.search).get("content") ?? null;
    const { room } = useMetadataContext(useShallow((state) => state));

    const getContent = () => {
        if (content === "help") {
            return <Help />;
        } else if (content === "changelog") {
            return <Changelog />;
        } else if (content === "settings") {
            return <Settings />;
        } else if (content === "dddice") {
            return <DiceLogin />;
        } else if (content === "dicetray") {
            const id = OBR.player.id;
            const diceUser = getRoomDiceUser(room, id);
            if (room && (!diceUser || (diceUser && diceUser.diceRendering)) && !room.disableDiceRoller) {
                return <DiceTray classes={"overlay"} overlay={true} />;
            } else {
                OBR.modal.close(diceTrayModalId);
            }
        } else {
            OBR.modal.close(modalId);
        }

        return <></>;
    };

    return <div className={"modal-wrapper"}>{getContent()}</div>;
};
