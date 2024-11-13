import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { modalId } from "../../../helper/variables.ts";
import { useInterval } from "../../../helper/hooks.ts";
import { updateRoomMetadataDiceUser } from "../../../helper/diceHelper.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useShallow } from "zustand/react/shallow";

export const DiceLogin = () => {
    const [activate, setActivate] = useState<{ code: string; expires_at: string; secret: string } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const room = useMetadataContext(useShallow((state) => state.room));
    const playerContext = usePlayerContext();

    const initAuth = async () => {
        const response = await fetch("https://dddice.com/api/1.0/activate", {
            method: "POST",
        });
        if (response.status === 200 || response.status === 201) {
            const data: { code: string; expires_at: string; secret: string } = (await response.json()).data;
            setActivate(data);
        }
    };

    useEffect(() => {
        initAuth();
    }, []);

    useInterval(() => {
        if (activate) {
            const now = new Date();
            const expire = new Date(activate.expires_at);
            const delta = expire.getTime() - now.getTime();
            if (delta < 0) {
                setTimeLeft(null);
                initAuth();
            } else {
                setTimeLeft(delta);
            }
        }
    }, 1000);

    useInterval(() => {
        const getUserLogin = async () => {
            if (activate) {
                const response = await fetch(`https://dddice.com/api/1.0/activate/${activate.code}`, {
                    headers: { Authorization: `Secret ${activate.secret}` },
                });

                if (response.status === 200) {
                    const data = (await response.json()).data;
                    if (data.token && room && playerContext.id) {
                        await updateRoomMetadataDiceUser(room, playerContext.id, { apiKey: data.token });
                        OBR.modal.close(modalId);
                    }
                }
            }
        };
        getUserLogin();
    }, 5000);

    return (
        <div className={"dddice-login-modal"}>
            <button className={"close-button"} onClick={async () => await OBR.modal.close(modalId)}>
                X
            </button>
            <div className={"content"}>
                <h1>dddice Login</h1>
                {activate ? (
                    <div className={"activate"}>
                        <span>Go to</span>
                        <a href={`https://dddice.com/activate?code=${activate.code}`} target={"_blank"}>
                            dddice.com/activate
                        </a>
                        <span>Then enter this code</span>
                        <div className={"code"}>
                            {Array.from(activate.code).map((l, index) => (
                                <span key={index} className={"letter"}>
                                    {l}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}
                {timeLeft ? (
                    <div className={"countdown"}>
                        <span>This code expires in</span>
                        {new Date(timeLeft).getMinutes().toLocaleString("en-US", {
                            minimumIntegerDigits: 2,
                            useGrouping: false,
                        })}
                        :
                        {new Date(timeLeft).getSeconds().toLocaleString("en-US", {
                            minimumIntegerDigits: 2,
                            useGrouping: false,
                        })}
                    </div>
                ) : null}
            </div>
        </div>
    );
};
