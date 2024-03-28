import OBR from "@owlbear-rodeo/sdk";
import { changelogModal, helpModal, settingsModal, statblockPopover } from "../../../helper/variables.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";

type HelpButtonsProps = {
    ignoredChanges?: boolean;
    setIgnoredChange?: (ignoredChanges: boolean) => void;
};

export const Helpbuttons = (props: HelpButtonsProps) => {
    const { room } = useMetadataContext();
    const playerContext = usePlayerContext();

    return (
        <div className={"help-buttons"}>
            <a
                href={"https://www.patreon.com/TTRPGAPI"}
                className={"patreon-button top-button link"}
                target={"_blank"}
                title={"Patreon Link"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 436 476">
                    <path
                        data-fill="1"
                        d="M436 143c-.084-60.778-47.57-110.591-103.285-128.565C263.528-7.884 172.279-4.649 106.214 26.424 26.142 64.089.988 146.596.051 228.883c-.77 67.653 6.004 245.841 106.83 247.11 74.917.948 86.072-95.279 120.737-141.623 24.662-32.972 56.417-42.285 95.507-51.929C390.309 265.865 436.097 213.011 436 143Z"
                    ></path>
                </svg>
            </a>
            {playerContext.role == "GM" ? (
                <>
                    <button
                        className={"statblock-button top-button"}
                        onClick={async () => {
                            // width needs to be big, to position statblock popover to the right
                            let width = 10000;
                            let height = 600;
                            try {
                                width = await OBR.viewport.getWidth();
                                height = await OBR.viewport.getHeight();
                            } catch {}

                            await OBR.popover.open({
                                ...statblockPopover,
                                width: Math.min(room?.statblockPopover?.width || 500, width),
                                height: Math.min(room?.statblockPopover?.height || 600, height),
                                anchorPosition: { top: 55, left: width - 70 },
                            });
                        }}
                        title={"Statblocks"}
                    ></button>
                    <button
                        className={"settings-button top-button"}
                        onClick={async () => {
                            let width = 600;
                            let height = 900;
                            try {
                                width = await OBR.viewport.getWidth();
                                height = await OBR.viewport.getHeight();
                            } catch {}
                            await OBR.modal.open({
                                ...settingsModal,
                                width: Math.min(500, width * 0.9),
                                height: Math.min(800, height * 0.9),
                            });
                        }}
                        title={"Settings"}
                    >
                        ⛭
                    </button>
                    <a href={"https://discord.gg/QckV5FZt"} className={"top-button link"} title={"discord"}>
                        <svg viewBox="0 0 127.14 96.36">
                            <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                        </svg>
                    </a>
                </>
            ) : null}
            <button
                className={`change-log-button top-button ${props.ignoredChanges ? "ignored" : ""}`}
                onClick={async () => {
                    if (props.setIgnoredChange !== undefined && props.ignoredChanges !== undefined) {
                        props.setIgnoredChange(!props.ignoredChanges);
                    }
                    let width = 700;
                    let height = 900;
                    try {
                        width = await OBR.viewport.getWidth();
                        height = await OBR.viewport.getHeight();
                    } catch {}
                    await OBR.modal.open({
                        ...changelogModal,
                        width: Math.min(600, width * 0.9),
                        height: Math.min(800, height * 0.9),
                    });
                }}
                title={"Changelog"}
            >
                i
            </button>
            <button
                className={"help-button top-button"}
                onClick={async () => {
                    let width = 800;
                    let height = 900;
                    try {
                        width = await OBR.viewport.getWidth();
                        height = await OBR.viewport.getHeight();
                    } catch {}
                    await OBR.modal.open({
                        ...helpModal,
                        width: Math.min(700, width * 0.9),
                        height: Math.min(800, height * 0.9),
                    });
                }}
                title={"Help"}
            >
                ?
            </button>
        </div>
    );
};
