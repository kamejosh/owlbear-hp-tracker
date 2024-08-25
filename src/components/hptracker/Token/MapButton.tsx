import { MapSvg } from "../../svgs/MapSvg.tsx";
import "./map-button.scss";
import tippy from "tippy.js";

export const MapButton = ({
    onClick,
    onContextMenu,
    active,
    tooltip,
}: {
    onClick: () => void;
    onContextMenu: () => void;
    active: boolean;
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
            </button>
        </div>
    );
};
