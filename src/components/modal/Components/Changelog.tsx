import { useEffect, useState } from "react";
import changelog from "../../../../CHANGELOG.md";
import { Markdown } from "../../general/Markdown.tsx";
import OBR from "@owlbear-rodeo/sdk";
import { modalId } from "../../../helper/variables.ts";

export const Changelog = () => {
    const [changelogText, setChangelogText] = useState<string>("");

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
            <h1>GM's Grimoire Changelog</h1>
            <Markdown text={changelogText} />
        </>
    );
};
