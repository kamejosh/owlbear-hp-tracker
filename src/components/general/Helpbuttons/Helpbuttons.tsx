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
                className={"patreon-button top-button"}
                target={"_blank"}
                title={"Patreon Link"}
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 436 476">
                    <path
                        data-fill="1"
                        d="M436 143c-.084-60.778-47.57-110.591-103.285-128.565C263.528-7.884 172.279-4.649 106.214 26.424 26.142 64.089.988 146.596.051 228.883c-.77 67.653 6.004 245.841 106.83 247.11 74.917.948 86.072-95.279 120.737-141.623 24.662-32.972 56.417-42.285 95.507-51.929C390.309 265.865 436.097 213.011 436 143Z"
                        fill={"#dddddd"}
                    ></path>
                </svg>
            </a>
            {playerContext.role == "GM" ? (
                <>
                    <button
                        className={"statblock-button top-button"}
                        onClick={async () => {
                            const width = await OBR.viewport.getWidth();
                            const height = await OBR.viewport.getHeight();
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
                        onClick={async () => await OBR.modal.open(settingsModal)}
                        title={"Settings"}
                    >
                        ⛭
                    </button>
                </>
            ) : null}
            <button
                className={`change-log-button top-button ${props.ignoredChanges ? "ignored" : ""}`}
                onClick={async () => {
                    if (props.setIgnoredChange !== undefined && props.ignoredChanges !== undefined) {
                        props.setIgnoredChange(!props.ignoredChanges);
                    }
                    await OBR.modal.open(changelogModal);
                }}
                title={"Changelog"}
            >
                i
            </button>
            <button
                className={"help-button top-button"}
                onClick={async () => await OBR.modal.open(helpModal)}
                title={"Help"}
            >
                ?
            </button>
        </div>
    );
};
