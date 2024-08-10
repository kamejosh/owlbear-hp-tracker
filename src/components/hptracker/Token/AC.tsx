import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { changeArmorClass } from "../../../helper/tokenHelper.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { useEffect, useRef } from "react";

export const AC = ({ id }: { id: string }) => {
    const room = useMetadataContext((state) => state.room);
    const acRef = useRef<HTMLInputElement>(null);
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const data = token?.data as HpTrackerMetadata;
    const item = token?.item as Image;

    useEffect(() => {
        if (acRef && acRef.current) {
            acRef.current.value = String(data?.armorClass);
        }
    }, [data?.armorClass]);

    return (
        <div className={"armor-class"}>
            <input
                ref={acRef}
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
        </div>
    );
};
