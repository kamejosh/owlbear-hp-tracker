import { MapSvg } from "../../svgs/MapSvg.tsx";
import "./map-button.scss";
import tippy from "tippy.js";
import { PlayerSvg } from "../../svgs/PlayerSvg.tsx";

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
            <button
                className={"map-default"}
                ref={(e) => {
                    if (e) {
                        tippy(e, { content: tooltip });
                    }
                }}
            >
                <MapSvg />
                {players ? <PlayerSvg /> : null}
            </button>
        </div>
    );
};
