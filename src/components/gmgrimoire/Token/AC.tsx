import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { changeArmorClass, updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { GMGMetadata } from "../../../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { ACSvg } from "../../svgs/ACSvg.tsx";
import { MapButton } from "./MapButton.tsx";
import "./ac.scss";
import { updateAc } from "../../../helper/acHelper.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { useDebounce } from "ahooks";

export const AC = ({ id, hideExtras }: { id: string; hideExtras?: boolean }) => {
    const playerContext = usePlayerContext();
    const room = useMetadataContext(useShallow((state) => state.room));
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;
    const [ac, setAc] = useState<string>(data.armorClass.toString());
    const debouncedAc = useDebounce(ac, { wait: 500 });

    useEffect(() => {
        let factor = 1;
        if (room?.allowNegativeNumbers) {
            factor = debouncedAc.startsWith("-") ? -1 : 1;
        }
        const value = Number(debouncedAc.replace(/[^0-9]/g, ""));
        changeArmorClass(value * factor, data, item, room);
    }, [debouncedAc]);

    return (
        <div className={`token-ac ${hideExtras ? "no-extras" : ""}`}>
            {!hideExtras ? <ACSvg /> : null}
            <Tippy content={"Set AC"}>
                <input
                    className={"ac-input"}
                    type={"text"}
                    size={1}
                    value={ac}
                    onChange={(e) => {
                        setAc(e.target.value);
                    }}
                    onKeyDown={(e) => {
                        const currentValue = Number(e.currentTarget.value);
                        if (e.key === "ArrowUp") {
                            setAc((currentValue + 1).toString());
                        } else if (e.key === "ArrowDown") {
                            setAc((currentValue - 1).toString());
                        }
                    }}
                />
            </Tippy>
            {playerContext.role === "GM" && !hideExtras ? (
                <MapButton
                    onClick={async () => {
                        const newData = { ...data, acOnMap: !data.acOnMap };
                        await updateTokenMetadata(newData, [id]);
                        await updateAc(item, newData);
                    }}
                    onContextMenu={async () => {
                        const newData = { ...data, playerMap: { hp: !!data.playerMap?.hp, ac: !data.playerMap?.ac } };
                        await updateTokenMetadata(newData, [id]);
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
