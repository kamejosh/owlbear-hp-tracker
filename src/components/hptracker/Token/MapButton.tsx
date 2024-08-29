import { MapSvg } from "../../svgs/MapSvg.tsx";
import "./map-button.scss";
import { PlayerSvg } from "../../svgs/PlayerSvg.tsx";
import Tippy from "@tippyjs/react";

export const MapButton = ({
    onClick,
    onContextMenu,
    active,
    players,
    tooltip,
}: {
    onClick: () => void;
    onContextMenu: () => void;
    active: boolean;
    players: boolean;
    tooltip: string;
}) => {
    return (
        <div
            className={`map-button ${active ? "active" : ""}`}
            onClick={() => onClick()}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu();
            }}
        >
            <Tippy content={tooltip}>
                <button className={"map-default"}>
                    <MapSvg />
                    {players ? <PlayerSvg /> : null}
                </button>
            </Tippy>
        </div>
    );
};
