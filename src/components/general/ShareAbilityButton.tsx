import { AbilityShareEntry } from "../../context/AbilityShareStore.tsx";
import { SendSvg } from "../svgs/SendSvg.tsx";
import { IconButton } from "./IconButton.tsx";
import { shareAbility } from "../../helper/helpers.ts";
import OBR from "@owlbear-rodeo/sdk";
import { autoPlacement, safePolygon, useFloating, useHover, useInteractions } from "@floating-ui/react";
import { useState } from "react";
import styles from "./icon-button.module.scss";

export const ShareAbilityButton = ({ entry }: { entry: AbilityShareEntry }) => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        middleware: [
            autoPlacement({
                autoAlignment: true,
                crossAxis: true,
                allowedPlacements: ["left", "right"],
            }),
        ],
    });

    const hover = useHover(context, { handleClose: safePolygon() });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    return (
        <>
            <IconButton
                ref={refs.setReference}
                {...getReferenceProps()}
                onClick={async () => {
                    const playerIds = (await OBR.party.getPlayers()).map((player) => player.id);
                    playerIds.push(OBR.player.id);
                    entry.timestamp = new Date().getTime();
                    entry.id = crypto.randomUUID();
                    entry.visibleFor = playerIds;
                    void shareAbility(entry);
                }}
            >
                <SendSvg />
            </IconButton>
            {isOpen ? (
                <div
                    className={styles.shareTargetButton}
                    ref={refs.setFloating}
                    {...getFloatingProps()}
                    style={floatingStyles}
                >
                    <button
                        onClick={async () => {
                            entry.timestamp = new Date().getTime();
                            entry.id = crypto.randomUUID();
                            entry.visibleFor = [OBR.player.id];
                            void shareAbility(entry);
                        }}
                    >
                        SELF
                    </button>
                    <button
                        onClick={async () => {
                            const playerIds = (await OBR.party.getPlayers())
                                .filter((player) => player.role === "GM")
                                .map((player) => player.id);
                            playerIds.push(OBR.player.id);
                            entry.timestamp = new Date().getTime();
                            entry.id = crypto.randomUUID();
                            entry.visibleFor = playerIds;
                            void shareAbility(entry);
                        }}
                    >
                        GM
                    </button>
                    <button
                        onClick={async () => {
                            const playerIds = (await OBR.party.getPlayers()).map((player) => player.id);
                            playerIds.push(OBR.player.id);
                            entry.timestamp = new Date().getTime();
                            entry.id = crypto.randomUUID();
                            entry.visibleFor = playerIds;
                            void shareAbility(entry);
                        }}
                    >
                        ALL
                    </button>
                </div>
            ) : null}
        </>
    );
};
