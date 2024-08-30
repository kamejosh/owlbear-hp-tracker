import { MapSvg } from "../../svgs/MapSvg.tsx";
import "./map-button.scss";
import { PlayerSvg } from "../../svgs/PlayerSvg.tsx";
import Tippy from "@tippyjs/react";
import { useRef } from "react";

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
    const start = useRef<number>(0);
    let timeout: number;

    return (
        <div
            className={`map-button ${active ? "active" : ""}`}
            onClick={() => onClick()}
            onContextMenu={(e) => {
                e.preventDefault();
                onContextMenu();
            }}
            onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                start.current = Date.now();
                timeout = setTimeout(() => {
                    onContextMenu();
                }, 300);
            }}
            onTouchEnd={(e) => {
                const now = Date.now();
                if (now - start.current < 300) {
                    clearTimeout(timeout);
                    onClick();
                } else {
                    e.preventDefault();
                    e.stopPropagation();
                }
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
