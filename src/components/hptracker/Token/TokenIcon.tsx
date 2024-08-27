import { CSSProperties } from "react";
import { ShieldSvg } from "../../svgs/ShieldSvg.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import "./token-icon.scss";

export const TokenIcon = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const data = token?.data as HpTrackerMetadata;
    const item = token?.item as Image;

    return (
        <div className={"token-icon"}>
            <img src={item.image.url} alt={""} />
            {playerContext.role === "GM" ? (
                <>
                    {!!data.playerMap?.hp && data.hpOnMap ? (
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
                            <span className={"preview-hp-text"}>
                                {data.hp}/{data.maxHp}
                                {data.stats?.tempHp ? `(${data.stats.tempHp})` : null}
                            </span>
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
    );
};
