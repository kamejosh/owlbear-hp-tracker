import React, { CSSProperties, useEffect, useState } from "react";
import { ShieldSvg } from "../../svgs/ShieldSvg.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { GMGMetadata } from "../../../helper/types.ts";
import OBR, { Image } from "@owlbear-rodeo/sdk";
import "./token-icon.scss";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useUISettingsContext } from "../../../context/UISettingsContext.ts";
import Tippy from "@tippyjs/react";
import { getTokenName, resyncToken } from "../../../helper/helpers.ts";
import { useShallow } from "zustand/react/shallow";
import { useE5GetStatblockMutation } from "../../../api/e5/useE5Api.ts";
import { usePFGetStatblockMutation } from "../../../api/pf/usePfApi.ts";
import { ContextPopover } from "../../general/ContextPopover.tsx";
import { GroupSelect } from "./GroupSelect.tsx";

let timeout: number | undefined = undefined;

export const TokenIcon = ({
    id,
    onClick,
    hideName,
    isDragging,
}: {
    id: string;
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => Promise<void>;
    hideName?: boolean;
    isDragging?: boolean;
}) => {
    const playerPreview = useUISettingsContext(useShallow((state) => state.playerPreview));
    const playerContext = usePlayerContext();
    const room = useMetadataContext(useShallow((state) => state.room));
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;
    const [mouseDown, setMouseDown] = useState<boolean>(false);
    const [contextEvent, setContextEvent] = useState<MouseEvent | null>(null);

    const getE5Statblock = useE5GetStatblockMutation();
    const getPFStatblock = usePFGetStatblockMutation();

    const handleOnPlayerDoubleClick = async () => {
        const bounds = await OBR.scene.items.getItemBounds([id]);
        await OBR.player.select([id]);
        await OBR.viewport.animateToBounds({
            ...bounds,
            min: { x: bounds.min.x - 1000, y: bounds.min.y - 1000 },
            max: { x: bounds.max.x + 1000, y: bounds.max.y + 1000 },
        });
    };
    const resync = async () => {
        if (data.sheet && room?.ruleset) {
            const statblock = await (room.ruleset === "e5" ? getE5Statblock : getPFStatblock).mutateAsync({
                slug: data.sheet,
                apiKey: room?.tabletopAlmanacAPIKey,
            });
            if (statblock) {
                await resyncToken(statblock, id, room.ruleset);
                const notification = await OBR.notification.show(
                    "Don't forget to close and reopen the Statblock Popover",
                    "SUCCESS",
                );
                setTimeout(async () => {
                    await OBR.notification.close(notification);
                }, 3000);
            }
        }
        setMouseDown(false);
    };

    useEffect(() => {
        if (isDragging) {
            setMouseDown(false);
            clearTimeout(timeout);
        }
    }, [isDragging]);

    return (
        <>
            <ContextPopover context={contextEvent}>
                <>
                    <GroupSelect
                        id={id}
                        onSelect={() => {
                            setContextEvent(null);
                        }}
                        data={data}
                    />
                </>
            </ContextPopover>
            <Tippy
                content={mouseDown ? "Resyncing Statblock..." : getTokenName(item)}
                hideOnClick={!mouseDown}
                className={"token-name-tooltip"}
                disabled={hideName}
            >
                <div
                    className={`token-icon ${mouseDown ? "mouse-down" : ""}`}
                    onDoubleClick={handleOnPlayerDoubleClick}
                    onClick={onClick}
                    onPointerDown={() => {
                        if (playerContext.role === "GM") {
                            setMouseDown(true);
                            timeout = setTimeout(() => resync(), 1000);
                        }
                    }}
                    onPointerUp={() => {
                        setMouseDown(false);
                        clearTimeout(timeout);
                    }}
                    onContextMenu={(e) => {
                        e.preventDefault();
                        setMouseDown(false);
                        clearTimeout(timeout);
                        setContextEvent(e.nativeEvent);
                    }}
                >
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
        </>
    );
};
