import { useEffect, useState } from "react";
import help from "../../../../USAGE.md";
import { Markdown } from "../../general/Markdown.tsx";
import { modalId } from "../../../helper/variables.ts";
import OBR from "@owlbear-rodeo/sdk";

export const Help = () => {
    const [helpText, setHelpText] = useState<string>("");

    useEffect(() => {
        fetch(help)
            .then((res) => res.text())
            .then((text) => setHelpText(text));
    }, []);
    return (
        <>
            <button className={"close-button"} onClick={async () => await OBR.modal.close(modalId)}>
                X
            </button>
            <div className={"patreon"} style={{fontSize: "0.8rem"}}>
                Consider supporting me on{" "}
                <a href={"https://www.patreon.com/TTRPGAPI"} target={"_blank"}>
                    Patreon
                </a>
            </div>
            <Markdown text={helpText} />
        </>
    );
};
