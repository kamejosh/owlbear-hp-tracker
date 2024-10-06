import React, { CSSProperties } from "react";
import { ShieldSvg } from "../../svgs/ShieldSvg.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { GMGMetadata } from "../../../helper/types.ts";
import OBR, { Image } from "@owlbear-rodeo/sdk";
import "./token-icon.scss";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useUISettingsContext } from "../../../context/UISettingsContext.ts";
import Tippy from "@tippyjs/react";
import { getTokenName } from "../../../helper/helpers.ts";

export const TokenIcon = ({
    id,
    onClick,
}: {
    id: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => Promise<void>;
}) => {
    const playerPreview = useUISettingsContext((state) => state.playerPreview);
    const playerContext = usePlayerContext();
    const room = useMetadataContext((state) => state.room);
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;

    const handleOnPlayerDoubleClick = async () => {
        const bounds = await OBR.scene.items.getItemBounds([id]);
        await OBR.player.select([id]);
        await OBR.viewport.animateToBounds({
            ...bounds,
            min: { x: bounds.min.x - 1000, y: bounds.min.y - 1000 },
            max: { x: bounds.max.x + 1000, y: bounds.max.y + 1000 },
        });
    };

    return (
        <Tippy content={getTokenName(item)} className={"token-name-tooltip"}>
            <div className={"token-icon"} onDoubleClick={handleOnPlayerDoubleClick} onClick={onClick}>
                <img
                    src={item.image.url}
                    alt={""}
                    className={`${item.scale.x < 0 && playerPreview ? "flipped" : ""}`}
                    style={{ rotate: `${playerPreview ? item.rotation + "deg" : 0 + "deg"}` }}
                />
                {playerContext.role === "GM" && playerPreview ? (
                    <>
                        {data.hpOnMap && !room?.disableHpBar ? (
                            <div
                                className={"preview-hp"}
                                style={
                                    {
                                        "--width": `${
                                            data.maxHp !== 0
                                                ? ((data.hp - (data.stats?.tempHp ?? 0)) / data.maxHp) * 100
                                                : 0
                                        }%`,
                                        "--temp-width": `${
                                            (data.maxHp !== 0
                                                ? data.stats?.tempHp
                                                    ? data.stats.tempHp / data.maxHp
                                                    : 0
                                                : 0) * 100
                                        }%`,
                                    } as CSSProperties
                                }
                            >
                                {!!data.playerMap?.hp ? (
                                    <span className={"preview-hp-text"}>
                                        {data.hp}/{data.maxHp}
                                        {data.stats?.tempHp ? `(${data.stats.tempHp})` : null}
                                    </span>
                                ) : null}
                            </div>
                        ) : null}
                        {!!data.playerMap?.ac && data.acOnMap ? (
                            <div className={"preview-ac"}>
                                <ShieldSvg />
                                <span className={"preview-value"}>{data.armorClass}</span>
                            </div>
                        ) : null}
                    </>
                ) : null}
            </div>
        </Tippy>
    );
};
