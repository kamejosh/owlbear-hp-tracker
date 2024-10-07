import { useEffect, useRef, useState } from "react";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { GMGMetadata } from "../../../helper/types.ts";
import { diceToRoll, getUserUuid, localRoll, rollWrapper } from "../../../helper/diceHelper.ts";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { D20 } from "../../svgs/dice/D20.tsx";
import { getDiceImage, getSvgForDiceType } from "../../../helper/previewHelpers.tsx";
import { InitiativeSvg } from "../../svgs/InitiativeSvg.tsx";
import "./initiative.scss";
import { PlayerButton } from "./PlayerButton.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import Tippy from "@tippyjs/react";
import { Image } from "@owlbear-rodeo/sdk";
import { getTokenName } from "../../../helper/helpers.ts";
export const Initiative = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const initRef = useRef<HTMLInputElement>(null);
    const initBonusRef = useRef<HTMLInputElement>(null);
    const [room, taSettings] = useMetadataContext((state) => [state.room, state.taSettings]);
    const [initHover, setInitHover] = useState<boolean>(false);
    const [rollerApi, theme] = useDiceRoller((state) => [state.rollerApi, state.theme]);
    const addRoll = useRollLogContext((state) => state.addRoll);
    const initButtonRef = useRef<HTMLButtonElement>(null);
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;
    const defaultHidden = playerContext.role === "GM" && !!taSettings.gm_rolls_hidden;

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

    const getDicePreview = () => {
        try {
            const initiativeDice = room?.initiativeDice ?? 20;
            const dieType = `d${initiativeDice}`;
            if (room?.disableDiceRoller) {
                return getSvgForDiceType(dieType);
            } else {
                if (theme) {
                    const image = getDiceImage(theme, dieType, 0);
                    return image ?? <D20 />;
                } else {
                    return <D20 />;
                }
            }
        } catch {
            return <D20 />;
        }
    };

    const rollInitiative = async (hidden: boolean, advantage?: boolean, disadvantage?: boolean) => {
        initButtonRef.current?.classList.add("rolling");
        let initiativeValue = 0;
        let dice;
        if (advantage) {
            dice = `2d${room?.initiativeDice ?? 20}kh1+${data.stats.initiativeBonus}`;
        } else if (disadvantage) {
            dice = `2d${room?.initiativeDice ?? 20}kl1+${data.stats.initiativeBonus}`;
        } else {
            dice = `1d${room?.initiativeDice ?? 20}+${data.stats.initiativeBonus}`;
        }
        if (room && !room?.disableDiceRoller && theme && rollerApi) {
            const parsed = diceToRoll(dice, theme.id);
            if (parsed) {
                const rollData = await rollWrapper(rollerApi, parsed.dice, {
                    operator: parsed.operator,
                    external_id: getTokenName(item),
                    label: "Initiative: Roll",
                    whisper: hidden ? await getUserUuid(room, rollerApi) : undefined,
                });
                initButtonRef.current?.classList.remove("rolling");
                if (rollData) {
                    initiativeValue = Number(rollData.total_value);
                }
            }
        } else {
            const result = await localRoll(dice, "Initiative: Roll", addRoll, hidden, getTokenName(item));
            initButtonRef.current?.classList.remove("rolling");
            if (result) {
                initiativeValue = result.total;
            }
        }
        initButtonRef.current?.classList.remove("rolling");
        initButtonRef.current?.blur();
        return initiativeValue;
    };

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
                    onChange={(e) => {
                        const newData = { ...data, initiative: Number(e.target.value) };
                        updateTokenMetadata(newData, [id]);
                    }}
                    className={"initiative"}
                />
            </Tippy>
            <div
                className={`init-wrapper button-wrapper calculated`}
                onMouseEnter={() => {
                    setInitHover(true);
                }}
                onMouseLeave={() => setInitHover(false)}
            >
                <button
                    ref={initButtonRef}
                    title={"Roll Initiative (including initiative modifier from statblock)"}
                    className={`dice-button button`}
                    onClick={async () => {
                        const value = await rollInitiative(defaultHidden);
                        const newData = { ...data, initiative: value };
                        updateTokenMetadata(newData, [id]);
                    }}
                >
                    <div className={"dice-preview"}>{getDicePreview()}</div>
                    {data.stats.initiativeBonus >= 0 ? "+" : ""}
                    {data.stats.initiativeBonus ?? 0}
                </button>
                <div className={`dice-context-button ${initHover ? "visible" : "hidden"}`}>
                    <button
                        className={`advantage`}
                        onClick={async () => {
                            const value = await rollInitiative(defaultHidden, true);
                            const newData = { ...data, initiative: value };
                            updateTokenMetadata(newData, [id]);
                        }}
                    >
                        {"ADV"}
                    </button>
                    <button
                        className={`disadvantage`}
                        onClick={async () => {
                            const value = await rollInitiative(defaultHidden, false, true);
                            const newData = { ...data, initiative: value };
                            updateTokenMetadata(newData, [id]);
                        }}
                    >
                        DIS
                    </button>
                    <button
                        className={`self`}
                        onClick={async () => {
                            const value = await rollInitiative(!defaultHidden);
                            const newData = { ...data, initiative: value };
                            updateTokenMetadata(newData, [id]);
                        }}
                    >
                        {defaultHidden ? "SHOW" : "HIDE"}
                    </button>
                </div>
            </div>

            <Tippy content={"Set initiative bonus"}>
                <input
                    type={"number"}
                    size={1}
                    defaultValue={data.stats.initiativeBonus}
                    step={1}
                    ref={initBonusRef}
                    onBlur={(e) => {
                        const value = Number(e.target.value);
                        const newData = { ...data, stats: { initiativeBonus: value } };
                        updateTokenMetadata(newData, [id]);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const value = Number(e.currentTarget.value);
                            const newData = { ...data, stats: { initiativeBonus: value } };
                            updateTokenMetadata(newData, [id]);
                        }
                    }}
                    className={"initiative-bonus"}
                />
            </Tippy>
            {playerContext.role === "GM" ? (
                <PlayerButton
                    active={!!data.playerList}
                    onClick={() => {
                        const newData = { ...data, playerList: !data.playerList };
                        updateTokenMetadata(newData, [id]);
                    }}
                />
            ) : null}
        </div>
    );
};
