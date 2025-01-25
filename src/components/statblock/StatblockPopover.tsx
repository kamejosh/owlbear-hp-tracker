import { statblockPopoverId } from "../../helper/variables.ts";
import OBR from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { StatblockList } from "./StatblockList.tsx";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { DiceTray } from "../general/DiceRoller/DiceTray.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { TokenContextWrapper } from "../TokenContextWrapper.tsx";
import { updateSceneMetadata } from "../../helper/helpers.ts";
import { useShallow } from "zustand/react/shallow";

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
    const [room, scene] = useMetadataContext(useShallow((state) => [state.room, state.scene]));
    const { isReady } = SceneReadyContext();

    const initPopover = async () => {
        const playerSelection = await OBR.player.getSelection();
        if (playerSelection && playerSelection.length === 1) {
            setSelection(playerSelection[0]);
        }
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
            void OBR.popover.setHeight(statblockPopoverId, room?.statblockPopover?.height || 600);
            void OBR.popover.setWidth(statblockPopoverId, room?.statblockPopover?.width || 500);
        }
    }, [room, isReady]);

    useEffect(() => {
        if (isReady) {
            void initPopover();
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
                        onClick={async () => {
                            const playerId = OBR.player.id;
                            const statblockPopoverOpen: { [key: string]: boolean } = scene?.statblockPopoverOpen
                                ? { ...scene.statblockPopoverOpen }
                                : {};
                            statblockPopoverOpen[playerId] = false;
                            await updateSceneMetadata(scene, { statblockPopoverOpen: statblockPopoverOpen });
                            await OBR.popover.close(statblockPopoverId);
                        }}
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
