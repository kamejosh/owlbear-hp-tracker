import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { changeArmorClass, updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { GMGMetadata } from "../../../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { useEffect, useRef } from "react";
import { ACSvg } from "../../svgs/ACSvg.tsx";
import { MapButton } from "./MapButton.tsx";
import "./ac.scss";
import { updateAc } from "../../../helper/acHelper.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import Tippy from "@tippyjs/react";

export const AC = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const room = useMetadataContext((state) => state.room);
    const acRef = useRef<HTMLInputElement>(null);
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;

    useEffect(() => {
        if (acRef && acRef.current) {
            acRef.current.value = String(data?.armorClass);
        }
    }, [data?.armorClass]);

    return (
        <div className={"token-ac"}>
            <ACSvg />
            <Tippy content={"Set AC"}>
                <input
                    className={"ac-input"}
                    type={"text"}
                    size={1}
                    value={data.armorClass}
                    onChange={(e) => {
                        let factor = 1;
                        if (room?.allowNegativeNumbers) {
                            factor = e.target.value.startsWith("-") ? -1 : 1;
                        }
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        changeArmorClass(value * factor, data, item, room);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowUp") {
                            changeArmorClass(data.armorClass + 1, data, item, room);
                        } else if (e.key === "ArrowDown") {
                            changeArmorClass(data.armorClass - 1, data, item, room);
                        }
                    }}
                />
            </Tippy>
            {playerContext.role === "GM" ? (
                <MapButton
                    onClick={async () => {
                        const newData = { ...data, acOnMap: !data.acOnMap };
                        updateTokenMetadata(newData, [id]);
                        await updateAc(item, newData);
                    }}
                    onContextMenu={async () => {
                        const newData = { ...data, playerMap: { hp: !!data.playerMap?.hp, ac: !data.playerMap?.ac } };
                        updateTokenMetadata(newData, [id]);
                        await updateAc(item, newData);
                    }}
                    active={data.acOnMap}
                    players={!!data.playerMap?.ac}
                    tooltip={"Add AC to map (players: right click)"}
                />
            ) : null}
        </div>
    );
};
