import { useEffect, useRef, useState } from "react";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import tippy from "tippy.js";
import { diceToRoll, getUserUuid, localRoll, rollWrapper } from "../../../helper/diceHelper.ts";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { D20 } from "../../svgs/dice/D20.tsx";
import { parseRollEquation } from "dddice-js";
import { getDiceImage, getSvgForDiceType } from "../../../helper/previewHelpers.tsx";
import { InitiativeSvg } from "../../svgs/InitiativeSvg.tsx";
import "./initiative.scss";
import { PlayerButton } from "./PlayerButton.tsx";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
export const Initiative = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const initRef = useRef<HTMLInputElement>(null);
    const initBonusRef = useRef<HTMLInputElement>(null);
    const room = useMetadataContext((state) => state.room);
    const [initHover, setInitHover] = useState<boolean>(false);
    const [rollerApi, theme] = useDiceRoller((state) => [state.rollerApi, state.theme]);
    const addRoll = useRollLogContext((state) => state.addRoll);
    const initButtonRef = useRef<HTMLButtonElement>(null);
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const data = token?.data as HpTrackerMetadata;

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

    useEffect(() => {
        if (initRef.current) {
            tippy(initRef.current, { content: "Set Initiative" });
        }
    }, [initRef]);

    useEffect(() => {
        if (initBonusRef.current) {
            tippy(initBonusRef.current, { content: "Set Initiative Bonus" });
        }
    }, [initBonusRef]);

    const getDicePreview = () => {
        try {
            const parsed = parseRollEquation(
                `1d${room?.initiativeDice}${data.stats.initiativeBonus ? "+" + data.stats.initiativeBonus : ""}`,
                "dddice-bees"
            );
            const die = parsed.dice.find((d) => d.type !== "mod");
            if (die) {
                if (room?.disableDiceRoller) {
                    return getSvgForDiceType(die.type);
                } else {
                    if (theme) {
                        const image = getDiceImage(theme, die, 0);
                        return image ?? <D20 />;
                    } else {
                        return <D20 />;
                    }
                }
            } else {
                return <D20 />;
            }
        } catch {
            return <D20 />;
        }
    };

    const rollInitiative = async (hidden: boolean) => {
        initButtonRef.current?.classList.add("rolling");
        let initiativeValue = 0;
        const dice = `1d${room?.initiativeDice ?? 20}+${data.stats.initiativeBonus}`;
        if (room && !room?.disableDiceRoller && theme && rollerApi) {
            const parsed = diceToRoll(dice, theme.id);
            if (parsed) {
                const rollData = await rollWrapper(rollerApi, parsed.dice, {
                    operator: parsed.operator,
                    external_id: data.name,
                    label: "Initiative: Roll",
                    whisper: hidden ? await getUserUuid(room, rollerApi) : undefined,
                });
                initButtonRef.current?.classList.remove("rolling");
                if (rollData) {
                    initiativeValue = Number(rollData.total_value);
                }
            }
        } else {
            const result = await localRoll(dice, "Initiative: Roll", addRoll, hidden, data.name);
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
                        const value = await rollInitiative(false);
                        const newData = { ...data, initiative: value };
                        updateTokenMetadata(newData, [id]);
                    }}
                >
                    <div className={"dice-preview"}>{getDicePreview()}</div>
                    {data.stats.initiativeBonus >= 0 ? "+" : ""}
                    {data.stats.initiativeBonus ?? 0}
                </button>
                <button
                    className={`self ${initHover ? "visible" : "hidden"}`}
                    onClick={async () => {
                        const value = await rollInitiative(true);
                        const newData = { ...data, initiative: value };
                        updateTokenMetadata(newData, [id]);
                    }}
                >
                    HIDE
                </button>
            </div>

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
