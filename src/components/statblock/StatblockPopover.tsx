import { statblockPopoverId } from "../../helper/variables.ts";
import OBR from "@owlbear-rodeo/sdk";

export const StatblockPopover = () => {
    window.addEventListener("resize", () => {
        console.log("resizing");
    });

    return (
        <>
            <button onClick={() => OBR.popover.close(statblockPopoverId)}>close</button>
        </>
    );
};
