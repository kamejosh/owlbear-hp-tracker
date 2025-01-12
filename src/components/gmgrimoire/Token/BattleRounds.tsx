import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { useMemo, useState } from "react";
import { useBattleContext } from "../../../context/BattleContext.tsx";
import Tippy from "@tippyjs/react";
import { GMGMetadata, SORT } from "../../../helper/types.ts";
import OBR, { Image } from "@owlbear-rodeo/sdk";
import { isUndefined } from "lodash";
import { destroyIndicator, setIndicator } from "../../../helper/currentHelper.ts";
import { rest } from "../../../helper/multiTokenHelper.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useShallow } from "zustand/react/shallow";

export const BattleRounds = () => {
    const tokens = useTokenListContext(useShallow((state) => state.tokens));
    const scene = useMetadataContext(useShallow((state) => state.scene));
    const [hold, setHold] = useState<boolean>(false);
    const [groups, current, setCurrent, battle, setBattle] = useBattleContext(
        useShallow((state) => [state.groups, state.current, state.setCurrent, state.battle, state.setBattle]),
    );
    const tokensData: Array<{ data: GMGMetadata; item: Image }> = tokens
        ? [...tokens].map((t) => {
              return { data: t[1].data, item: t[1].item };
          })
        : [];

    const battleTokens = useMemo(() => {
        const tokens = tokensData
            .filter((td) => {
                if (groups.includes(td.data.group ?? "")) {
                    return true;
                } else if (groups.includes("Default") && isUndefined(td.data.group)) {
                    return true;
                } else {
                    return false;
                }
            })
            .sort((a, b) => {
                if (
                    b.data.initiative === a.data.initiative &&
                    !isUndefined(b.data.stats.initiativeBonus) &&
                    !isUndefined(a.data.stats.initiativeBonus)
                ) {
                    if (
                        b.data.stats.initiativeBonus === a.data.stats.initiativeBonus &&
                        !isUndefined(b.data.index) &&
                        !isUndefined(a.data.index)
                    ) {
                        return a.data.index - b.data.index;
                    }
                    return b.data.stats.initiativeBonus - a.data.stats.initiativeBonus;
                }
                return b.data.initiative - a.data.initiative;
            });
        if (scene?.enableAutoSort && scene?.sortMethod === SORT.ASC) {
            return tokens.reverse();
        } else {
            return tokens;
        }
    }, [tokensData, groups]);
    const [battleRound, setBattleRound] = useState<number>(1);

    const stopBattle = () => {
        setBattle(false);
        setBattleRound(1);
        setCurrent(null);
        destroyIndicator();
        rest(
            battleTokens.map((b) => b.item),
            "Round",
        );
    };

    const changeCurrent = async (mod: number) => {
        if (groups.length === 0 || battleTokens.length === 0) {
            stopBattle();
            await OBR.notification.show("GM's Grimoire - No groups or tokens assigned for battle!", "WARNING");
            return;
        }
        const currentTokenIndex = current ? battleTokens.findIndex((bt) => bt.item.id === current) : 0;
        const nextIndex = currentTokenIndex + mod;
        let newCurrent: Image;
        if (nextIndex >= 0 && nextIndex < battleTokens.length) {
            newCurrent = battleTokens[currentTokenIndex + mod].item;
        } else if (nextIndex < 0) {
            newCurrent = battleTokens[battleTokens.length - 1].item;
            setBattleRound(battleRound + mod);
        } else {
            newCurrent = battleTokens[0].item;
            setBattleRound(battleRound + mod);
            await rest(
                battleTokens.map((b) => b.item),
                "Round",
            );
        }
        setCurrent(newCurrent.id);
        await setIndicator(newCurrent);
        setHold(true);
        setTimeout(() => {
            setHold(false);
        }, 500);
    };

    return (
        <div
            className={"battle-rounds"}
            onKeyDown={async (e) => {
                if (e.key === "ArrowRight") {
                    await changeCurrent(+1);
                } else if (e.key === "ArrowLeft") {
                    await changeCurrent(-1);
                }
            }}
        >
            {!battle ? (
                <Tippy
                    content={"no groups or tokens selected for battle"}
                    disabled={groups.length > 0 || battleTokens.length > 0}
                >
                    <button
                        disabled={groups.length === 0 || battleTokens.length === 0}
                        className={"button"}
                        onClick={async () => {
                            if (battleTokens.length > 0) {
                                await changeCurrent(0);
                                setBattle(true);
                            }
                        }}
                    >
                        Start Battle
                    </button>
                </Tippy>
            ) : (
                <>
                    <button
                        className={"button"}
                        disabled={hold}
                        onClick={async () => {
                            await changeCurrent(-1);
                        }}
                    >
                        Back
                    </button>
                    <span className={"battle-round"}>{battleRound}</span>
                    <button
                        className={"button"}
                        disabled={hold}
                        onClick={async () => {
                            await changeCurrent(+1);
                        }}
                    >
                        Next
                    </button>
                    <button
                        className={"button"}
                        onClick={() => {
                            stopBattle();
                        }}
                    >
                        Stop battle
                    </button>
                </>
            )}
        </div>
    );
};
