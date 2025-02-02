import { PlayerSvg } from "../../svgs/PlayerSvg.tsx";
import "./player-button.scss";
import Tippy from "@tippyjs/react";

export const PlayerButton = ({ active, onClick }: { active: boolean; onClick: () => void }) => {
    return (
        <Tippy content={"Show Token in Player Initiative List"}>
            <div className={`player-button ${active ? "active" : ""}`}>
                <button className={"player-default"} onClick={onClick}>
                    <PlayerSvg />
                </button>
            </div>
        </Tippy>
    );
};
