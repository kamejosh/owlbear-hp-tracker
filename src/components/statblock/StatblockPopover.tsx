import { characterMetadata, statblockPopoverId } from "../../helper/variables.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { StatblockList } from "./StatblockList.tsx";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { SceneReadyContext } from "../../context/SceneReadyContext.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import { sortItems } from "../../helper/helpers.ts";

export const StatblockPopover = () => {
    window.addEventListener("resize", () => {
        console.log("resizing");
    });

    const [minimized, setMinimized] = useState<boolean>(false);
    const [tokens, setTokens] = useState<Array<Item>>([]);
    const { isReady } = SceneReadyContext();

    const initPopover = async () => {
        const initialItems = await OBR.scene.items.getItems(
            (item) =>
                characterMetadata in item.metadata &&
                (item.metadata[characterMetadata] as HpTrackerMetadata).hpTrackerActive &&
                (item.metadata[characterMetadata] as HpTrackerMetadata).sheet !== ""
        );
        setTokens(initialItems.sort(sortItems));

        OBR.scene.items.onChange(async (items) => {
            const filteredItems = items.filter(
                (item) =>
                    characterMetadata in item.metadata &&
                    (item.metadata[characterMetadata] as HpTrackerMetadata).hpTrackerActive &&
                    (item.metadata[characterMetadata] as HpTrackerMetadata).sheet !== ""
            );
            setTokens(Array.from(filteredItems.sort(sortItems)));
        });
    };

    useEffect(() => {
        if (isReady) {
            initPopover();
        }
    }, [isReady]);

    return (
        <ContextWrapper>
            <div className={"statblock-popover"}>
                <div className={"help-buttons"}>
                    <button
                        className={"top-button"}
                        onClick={() => {
                            if (minimized) {
                                OBR.popover.setHeight(statblockPopoverId, 600);
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
                <StatblockList minimized={minimized} tokens={tokens} />
            </div>
        </ContextWrapper>
    );
};
