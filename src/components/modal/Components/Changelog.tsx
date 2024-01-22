import { useEffect, useState } from "react";
import changelog from "../../../../CHANGELOG.md";
import { Markdown } from "../../general/Markdown.tsx";
import OBR from "@owlbear-rodeo/sdk";
import { modalId } from "../../../helper/variables.ts";
import { updateRoomMetadata } from "../../../helper/helpers.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";

export const Changelog = () => {
    const [changelogText, setChangelogText] = useState<string>("");
    const { room } = useMetadataContext();
    const update = new URLSearchParams(window.location.search).get("update") ?? "false";

    useEffect(() => {
        fetch(changelog)
            .then((res) => res.text())
            .then((text) => setChangelogText(text));
    }, []);
    return (
        <>
            <button className={"close-button"} onClick={async () => await OBR.modal.close(modalId)}>
                X
            </button>
            {update === "true" ? (
                <div className={"disable-updates"}>
                    Don't Show Changelog on Updates:{" "}
                    <input
                        type={"checkbox"}
                        checked={room?.ignoreUpdateNotification || false}
                        onChange={() => {
                            updateRoomMetadata(room, { ignoreUpdateNotification: !room?.ignoreUpdateNotification });
                        }}
                    />
                </div>
            ) : null}
            <h1>HP Tracker Changelog</h1>
            <Markdown text={changelogText} />
        </>
    );
};
