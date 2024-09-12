import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { useState } from "react";
import { useBattleContext } from "../../../context/BattleContext.tsx";
import Tippy from "@tippyjs/react";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import OBR, { Image } from "@owlbear-rodeo/sdk";
import { isUndefined } from "lodash";
import { destroyIndicator, setIndicator } from "../../../helper/currentHelper.ts";
import { rest } from "../../../helper/multiTokenHelper.ts";

export const BattleRounds = () => {
    const tokens = useTokenListContext((state) => state.tokens);
    const [groups, current, setCurrent, battle, setBattle] = useBattleContext((state) => [
        state.groups,
        state.current,
        state.setCurrent,
        state.battle,
        state.setBattle,
    ]);
    const tokensData: Array<{ data: HpTrackerMetadata; item: Image }> = tokens
        ? [...tokens].map((t) => {
              return { data: t[1].data, item: t[1].item };
          })
        : [];
    const battleTokens = tokensData
        .filter((td) => groups.includes(td.data.group ?? ""))
        .sort((a, b) => {
            if (
                b.data.initiative === a.data.initiative &&
                !isUndefined(b.data.stats.initiativeBonus) &&
                !isUndefined(a.data.stats.initiativeBonus)
            ) {
                return b.data.stats.initiativeBonus - a.data.stats.initiativeBonus;
            }
            return b.data.initiative - a.data.initiative;
        });
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
    };

    return (
        <div
            className={"battle-rounds"}
            onKeyDown={(e) => {
                if (e.key === "ArrowRight") {
                    changeCurrent(+1);
                } else if (e.key === "ArrowLeft") {
                    changeCurrent(-1);
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
                        onClick={() => {
                            if (battleTokens.length > 0) {
                                changeCurrent(0);
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
                        onClick={() => {
                            changeCurrent(-1);
                        }}
                    >
                        Back
                    </button>
                    <span className={"battle-round"}>{battleRound}</span>
                    <button
                        className={"button"}
                        onClick={() => {
                            changeCurrent(+1);
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
