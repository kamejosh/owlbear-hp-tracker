import { useState } from "react";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { RollLog } from "./RollLog.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateRoomMetadataApiKey, updateRoomMetadataDiceRoom } from "../../../helper/diceHelper.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { DiceSettings } from "./DiceSettings.tsx";

export const DiceRoom = ({ className }: { className?: string }) => {
    const { room } = useMetadataContext();
    const { roller } = useDiceRoller();
    const playerContext = usePlayerContext();
    const { clear } = useRollLogContext();
    const [open, setOpen] = useState<boolean>(false);

    return (
        <div className={`dice-room ${className} ${open ? "open" : "closed"}`}>
            <button
                className={`open-dice-tray button icon ${open ? "open" : "closed"}`}
                onClick={(e) => {
                    setOpen(!open);
                    useRollLogContext.persist.rehydrate();
                    e.currentTarget.blur();
                }}
            >
                <DiceSvg />
            </button>

            <div className={"dice-tray-wrapper"}>
                <div className={`dice-tray ${open ? "open" : "closed"}`}>
                    <div className={"dice-tray-content"}>
                        <div className={"top"}>
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
                                    <svg
                                        className={"copy-icon"}
                                        height="18.499901"
                                        viewBox="0 -960 619.99603 739.99603"
                                        width="15.499901"
                                        version="1.1"
                                    >
                                        <path d="m 212.306,-360.002 q -30.308,0 -51.307,-21 -21,-21 -21,-51.308 v -455.382 q 0,-30.308 21,-51.308 20.999,-21 51.307,-21 h 335.383 q 30.307,0 51.307,21 21,21 21,51.308 v 455.382 q 0,30.308 -21,51.308 -21,21 -51.307,21 z m 0,-59.999 h 335.383 q 4.615,0 8.462,-3.846 3.846,-3.847 3.846,-8.463 v -455.382 q 0,-4.616 -3.846,-8.463 -3.847,-3.846 -8.462,-3.846 H 212.306 q -4.616,0 -8.462,3.846 -3.847,3.847 -3.847,8.463 v 455.382 q 0,4.616 3.847,8.463 3.846,3.846 8.462,3.846 z M 72.307001,-220.004 q -30.307,0 -51.307,-21 Q 1.0986328e-6,-262.004 1.0986328e-6,-292.311 V -807.692 H 59.999001 v 515.381 q 0,4.616 3.846,8.462 3.847,3.847 8.462,3.847 H 467.689 v 59.998 z M 199.997,-420.001 v -480 z" />
                                    </svg>
                                </button>
                            </div>
                            <button
                                className={"clear-log"}
                                onClick={() => {
                                    clear();
                                }}
                            >
                                clear
                            </button>
                            <button
                                className={"dddice-disconnect"}
                                onClick={async () => {
                                    if (room && playerContext.id) {
                                        const user = (await roller.api?.user.get())?.data;
                                        if (user && room?.diceRoom?.slug) {
                                            const diceRoom = (await roller.api?.room.get(room?.diceRoom?.slug))?.data;
                                            const participant = diceRoom?.participants.find(
                                                (p) => p.user.uuid === user.uuid
                                            );
                                            if (participant) {
                                                roller.api?.room.leave(room.diceRoom.slug, participant.id.toString());
                                            }
                                        }
                                        await updateRoomMetadataApiKey(room, undefined, playerContext.id);
                                        if (playerContext.role === "GM") {
                                            await updateRoomMetadataDiceRoom(room, undefined);
                                        }
                                    }
                                }}
                            >
                                Logout
                            </button>
                        </div>
                        <DiceSettings />
                        <RollLog />
                    </div>
                </div>
            </div>
        </div>
    );
};
