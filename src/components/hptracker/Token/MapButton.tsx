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
    onClick: () => Promise<void>;
    onContextMenu: () => Promise<void>;
    active: boolean;
    players: boolean;
    tooltip: string;
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const start = useRef<number>(0);
    let timeout: number;

    return (
        <div className={`map-button ${active ? "active" : ""}`}>
            <Tippy content={tooltip}>
                <button
                    ref={buttonRef}
                    className={"map-default"}
                    onClick={async () => {
                        try {
                            if (buttonRef.current) {
                                buttonRef.current.disabled = true;
                                buttonRef.current.classList.add("loading");
                            }
                            await onClick();
                        } finally {
                            if (buttonRef.current) {
                                buttonRef.current.disabled = false;
                                buttonRef.current.classList.remove("loading");
                            }
                        }
                    }}
                    onContextMenu={async (e) => {
                        e.preventDefault();
                        if (!buttonRef?.current?.disabled) {
                            try {
                                if (buttonRef.current) {
                                    buttonRef.current.disabled = true;
                                    buttonRef.current.classList.add("loading");
                                }
                                await onContextMenu();
                            } finally {
                                if (buttonRef.current) {
                                    buttonRef.current.disabled = false;
                                    buttonRef.current.classList.remove("loading");
                                }
                            }
                        }
                    }}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        start.current = Date.now();
                        timeout = setTimeout(async () => {
                            try {
                                if (buttonRef.current) {
                                    buttonRef.current.disabled = true;
                                    buttonRef.current.classList.add("loading");
                                }
                                await onContextMenu();
                            } finally {
                                if (buttonRef.current) {
                                    buttonRef.current.disabled = false;
                                    buttonRef.current.classList.remove("loading");
                                }
                            }
                        }, 300);
                    }}
                    onTouchEnd={async (e) => {
                        const now = Date.now();
                        if (now - start.current < 300) {
                            clearTimeout(timeout);
                            try {
                                if (buttonRef.current) {
                                    buttonRef.current.disabled = true;
                                    buttonRef.current.classList.add("loading");
                                }
                                await onClick();
                            } finally {
                                if (buttonRef.current) {
                                    buttonRef.current.disabled = false;
                                    buttonRef.current.classList.remove("loading");
                                }
                            }
                        } else {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }}
                >
                    <MapSvg />
                    {players ? <PlayerSvg /> : null}
                </button>
            </Tippy>
        </div>
    );
};
