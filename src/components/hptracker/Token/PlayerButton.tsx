import { PlayerSvg } from "../../svgs/PlayerSvg.tsx";
import "./player-button.scss";
import tippy from "tippy.js";

export const PlayerButton = ({ active, onClick }: { active: boolean; onClick: () => void }) => {
    return (
        <div
            className={`player-button ${active ? "active" : ""}`}
            ref={(e) => {
                if (e) {
                    tippy(e, { content: "Show in Player Initiative View" });
                }
            }}
        >
            <button className={"player-default"} onClick={onClick}>
                <PlayerSvg />
            </button>
        </div>
    );
};
