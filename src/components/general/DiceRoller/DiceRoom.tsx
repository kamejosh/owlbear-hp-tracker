import { useEffect, useState } from "react";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { RollLog } from "./RollLog.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { DiceSettings } from "./DiceSettings.tsx";
import OBR from "@owlbear-rodeo/sdk";
import { diceModal } from "../../../helper/variables.ts";
import { DiceRoomButtons } from "./DiceRoomButtons.tsx";
import { CopySvg } from "../../svgs/CopySvg.tsx";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { getDiceUser } from "../../../helper/diceHelper.ts";
import { IUser } from "dddice-js";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { updateRoomMetadata } from "../../../helper/helpers.ts";

export const DiceRoom = ({ className }: { className?: string }) => {
    const room = useMetadataContext((state) => state.room);
    const clear = useRollLogContext((state) => state.clear);
    const rollerApi = useDiceRoller((state) => state.rollerApi);
    const [settings, setSettings] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const [user, setUser] = useState<IUser>();
    const playerContext = usePlayerContext();

    useEffect(() => {
        const initUser = async () => {
            if (rollerApi) {
                const user = await getDiceUser(rollerApi);
                if (user) {
                    setUser(user);
                }
            }
        };
        initUser();
    }, [rollerApi]);

    useEffect(() => {
        if (!open) {
            setSettings(false);
        }
    }, [open]);

    console.log("DiceRoom rerender");

    return (
        <div className={`dice-room ${className} ${open ? "open" : "closed"}`}>
            <DiceRoomButtons open={open} setOpen={setOpen} />
            <div className={"dice-tray-wrapper"}>
                <div className={`dice-tray ${open ? "open" : "closed"}`}>
                    <div className={"dice-tray-content"}>
                        <div className={"top"}>
                            {room?.disableDiceRoller ? (
                                <>
                                    <button
                                        className={"clear-log"}
                                        onClick={() => {
                                            clear();
                                        }}
                                    >
                                        Clear
                                    </button>

                                    {playerContext.role === "GM" ? (
                                        <button
                                            onClick={async () => {
                                                await updateRoomMetadata(room, { disableDiceRoller: false });
                                            }}
                                        >
                                            Enabled dddice Integration
                                        </button>
                                    ) : null}
                                </>
                            ) : (
                                <>
                                    <button
                                        className={"dddice-login"}
                                        onClick={async () => {
                                            let width = 500;
                                            let height = 600;
                                            try {
                                                width = await OBR.viewport.getWidth();
                                                height = await OBR.viewport.getHeight();
                                            } catch {}
                                            await OBR.modal.open({
                                                ...diceModal,
                                                width: Math.min(400, width * 0.9),
                                                height: Math.min(500, height * 0.9),
                                            });
                                        }}
                                    >
                                        {user && user.name !== "Guest User" ? user.username : "Login"}
                                    </button>
                                    <div className={"room-link"}>
                                        <a href={`https://dddice.com/room/${room?.diceRoom?.slug}`} target={"_blank"}>
                                            Room Link
                                        </a>
                                        <button
                                            className={"copy-link"}
                                            onClick={(e) => {
                                                navigator.clipboard.writeText(
                                                    `https://dddice.com/room/${room?.diceRoom?.slug}`
                                                );
                                                e.currentTarget.blur();
                                            }}
                                        >
                                            <CopySvg />
                                        </button>
                                    </div>
                                    <div className={"side-buttons"}>
                                        <button
                                            className={"clear-log"}
                                            onClick={() => {
                                                clear();
                                            }}
                                        >
                                            Clear
                                        </button>
                                        <div className={"dice-settings-wrapper"}>
                                            <button
                                                className={"dice-settings-button"}
                                                onClick={() => {
                                                    setSettings(!settings);
                                                }}
                                            >
                                                Settings
                                            </button>
                                            {settings ? <DiceSettings setSettings={setSettings} /> : null}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <RollLog />
                    </div>
                </div>
            </div>
        </div>
    );
};
