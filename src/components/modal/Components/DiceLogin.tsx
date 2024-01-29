import { useEffect, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";
import { modalId } from "../../../helper/variables.ts";
import { useInterval } from "../../../helper/hooks.ts";
import { updateRoomMetadataDiceUser } from "../../../helper/diceHelper.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";

export const DiceLogin = () => {
    const [activate, setActivate] = useState<{ code: string; expires_at: string; secret: string } | null>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const { room } = useMetadataContext();
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
            <h1>dddice Login</h1>
            {activate ? (
                <div className={"activate"}>
                    Go to
                    <a href={`https://dddice.com/activate?code=${activate.code}`} target={"_blank"}>
                        dddice.com/activate
                    </a>
                    Then enter this code
                    <div className={"code"}>{activate.code}</div>
                </div>
            ) : null}
            {timeLeft ? (
                <span>
                    This code expires in
                    {new Date(timeLeft).getMinutes()}:{new Date(timeLeft).getSeconds()}
                </span>
            ) : null}
            <button
                className={"button guest-button"}
                onClick={() => {
                    OBR.modal.close(modalId);
                }}
            >
                Continue as guest
            </button>
        </div>
    );
};
