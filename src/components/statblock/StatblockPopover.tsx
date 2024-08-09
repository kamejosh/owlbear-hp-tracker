import { statblockPopoverId } from "../../helper/variables.ts";
import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { StatblockList } from "./StatblockList.tsx";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { DiceTray } from "../general/DiceRoller/DiceTray.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { TokenContextWrapper } from "../TokenContextWrapper.tsx";

export const StatblockPopover = () => {
    return (
        <ContextWrapper component={"statblock-popover"}>
            <TokenContextWrapper>
                <Content />
            </TokenContextWrapper>
        </ContextWrapper>
    );
};

const Content = () => {
    const [minimized, setMinimized] = useState<boolean>(false);
    const [pinned, setPinned] = useState<boolean>(false);
    const [selection, setSelection] = useState<string>();
    const [room] = useMetadataContext((state) => [state.room, state.scene]);
    const { isReady } = SceneReadyContext();

    const initPopover = async () => {
        OBR.player.onChange(async (player) => {
            if (player.selection && player.selection.length === 1) {
                if (player.selection[0] !== selection) {
                    setSelection(player.selection[0]);
                }
            } else {
                setSelection(undefined);
            }
        });
    };

    useEffect(() => {
        if (!minimized && isReady) {
            OBR.popover.setHeight(statblockPopoverId, room?.statblockPopover?.height || 600);
            OBR.popover.setWidth(statblockPopoverId, room?.statblockPopover?.width || 500);
        }
    }, [room, isReady]);

    useEffect(() => {
        if (isReady) {
            initPopover();
        }
    }, [isReady]);

    return (
        <>
            <div className={`statblock-popover ${minimized ? "minimized" : ""}`}>
                <div className={"help-buttons statblock"}>
                    <button
                        className={"top-button"}
                        onClick={() => {
                            if (minimized) {
                                OBR.popover.setHeight(statblockPopoverId, room?.statblockPopover?.height || 600);
                            } else {
                                OBR.popover.setHeight(statblockPopoverId, 100);
                            }
                            setMinimized(!minimized);
                        }}
                        title={"minmize"}
                    >
                        {minimized ? <div className={"square"}></div> : "-"}
                    </button>
                    <button
                        className={"top-button"}
                        onClick={() => OBR.popover.close(statblockPopoverId)}
                        title={"close"}
                    >
                        X
                    </button>
                </div>
                <StatblockList minimized={minimized} pinned={pinned} setPinned={setPinned} selection={selection} />
            </div>
            <DiceTray classes={`statblock-dice-tray ${minimized ? "hidden" : ""}`} />
        </>
    );
};
