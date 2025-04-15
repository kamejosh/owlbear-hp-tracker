import { useEffect, useRef } from "react";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { GMGMetadata } from "../../../helper/types.ts";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { InitiativeSvg } from "../../svgs/InitiativeSvg.tsx";
import "./initiative.scss";
import { PlayerButton } from "./PlayerButton.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import Tippy from "@tippyjs/react";
import { Image } from "@owlbear-rodeo/sdk";
import { getTokenName } from "../../../helper/helpers.ts";
import { useShallow } from "zustand/react/shallow";
import { setPrettySordidInitiative } from "../../../helper/prettySordidHelpers.ts";
import { DiceButton } from "../../general/DiceRoller/DiceButtonWrapper.tsx";
import { defaultStats } from "../../../helper/variables.ts";
export const Initiative = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const initRef = useRef<HTMLInputElement>(null);
    const initBonusRef = useRef<HTMLInputElement>(null);
    const [room, taSettings] = useMetadataContext(useShallow((state) => [state.room, state.taSettings]));
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;

    useEffect(() => {
        if (initRef && initRef.current) {
            initRef.current.value = String(data?.initiative);
        }
    }, [data?.initiative]);

    useEffect(() => {
        if (initBonusRef && initBonusRef.current) {
            initBonusRef.current.value = String(data?.stats.initiativeBonus);
        }
    }, [data?.stats.initiativeBonus]);

    return (
        <div className={"initiative-wrapper"}>
            <InitiativeSvg />
            <Tippy content={"Set initiative"}>
                <input
                    type={"number"}
                    size={1}
                    value={String(data.initiative)}
                    step={0.1}
                    ref={initRef}
                    onChange={async (e) => {
                        const newData = { ...data, initiative: Number(e.target.value) };
                        await updateTokenMetadata(newData, [id]);
                        await setPrettySordidInitiative(id, taSettings, Number(e.target.value));
                    }}
                    className={"initiative"}
                />
            </Tippy>
            <DiceButton
                dice={`1d${room?.initiativeDice || 20}${Intl.NumberFormat("en-US", { signDisplay: "always" }).format(data.stats.initiativeBonus)}`}
                text={Intl.NumberFormat("en-US", { signDisplay: "always" }).format(data.stats.initiativeBonus)}
                context={"Initiative: Roll"}
                stats={defaultStats}
                statblock={data.sheet || getTokenName(item)}
                onRoll={async (rollResult) => {
                    let initiative = 0;
                    try {
                        if (rollResult && "total" in rollResult) {
                            initiative = rollResult.total;
                        } else if (rollResult && "values" in rollResult) {
                            initiative = rollResult.values.map((v) => v.value).reduce((a, b) => a + b, 0);
                        }
                    } catch {}
                    const newData = { ...data, initiative: initiative };
                    await updateTokenMetadata(newData, [id]);
                    await setPrettySordidInitiative(id, taSettings, initiative);
                }}
                classes={"init-wrapper"}
            />

            <Tippy content={"Set initiative bonus"}>
                <input
                    type={"number"}
                    size={1}
                    defaultValue={data.stats.initiativeBonus}
                    step={1}
                    ref={initBonusRef}
                    onBlur={async (e) => {
                        const value = Number(e.target.value);
                        const newData = { ...data, stats: { initiativeBonus: value } };
                        await updateTokenMetadata(newData, [id]);
                    }}
                    onKeyDown={async (e) => {
                        if (e.key === "Enter") {
                            const value = Number(e.currentTarget.value);
                            const newData = { ...data, stats: { initiativeBonus: value } };
                            await updateTokenMetadata(newData, [id]);
                        }
                    }}
                    className={"initiative-bonus"}
                />
            </Tippy>
            {playerContext.role === "GM" ? (
                <PlayerButton
                    active={!!data.playerList}
                    onClick={async () => {
                        const newData = { ...data, playerList: !data.playerList };
                        await updateTokenMetadata(newData, [id]);
                    }}
                />
            ) : null}
        </div>
    );
};
