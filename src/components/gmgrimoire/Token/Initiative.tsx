import { useEffect, useMemo, useState } from "react";
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
import { isNumber, toInteger } from "lodash";
import { useDebounce } from "ahooks";

export const Initiative = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const [room, taSettings] = useMetadataContext(useShallow((state) => [state.room, state.taSettings]));
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;
    const [initiative, setInitiative] = useState<number>(data.initiative);
    const [initiativeBonus, setInitiativeBonus] = useState<number>(data.stats.initiativeBonus);
    const debouncedInitiative = useDebounce(initiative, { wait: 500 });
    const debouncedInitiativeBonus = useDebounce(initiativeBonus, { wait: 500 });

    useEffect(() => {
        const update = async () => {
            const newData = { ...data, initiative: Number(debouncedInitiative) };
            await updateTokenMetadata(newData, [id]);
            await setPrettySordidInitiative(id, taSettings, Number(debouncedInitiative));
        };
        void update();
    }, [debouncedInitiative]);

    useEffect(() => {
        const update = async () => {
            const newData = { ...data, stats: { initiativeBonus: debouncedInitiativeBonus } };
            await updateTokenMetadata(newData, [id]);
        };
        void update();
    }, [debouncedInitiativeBonus]);

    const customDiceTheme = useMemo(() => {
        if (item.createdUserId != playerContext.id) {
            const diceUser = room?.diceUser?.find((u) => u.playerId == item.createdUserId);
            if (diceUser) {
                return diceUser.diceTheme;
            }
            return undefined;
        }
    }, [item, playerContext, room]);

    return (
        <div className={"initiative-wrapper"}>
            <InitiativeSvg />
            <Tippy content={"Set initiative"}>
                <input
                    type={"number"}
                    size={1}
                    value={initiative}
                    step={0.1}
                    onChange={(e) => {
                        setInitiative(Number(e.target.value));
                    }}
                    className={"initiative"}
                />
            </Tippy>
            <DiceButton
                dice={`1d${room?.initiativeDice || 20}${Intl.NumberFormat("en-US", { signDisplay: "always" }).format(data.stats.initiativeBonus)}`}
                text={Intl.NumberFormat("en-US", { signDisplay: "always" }).format(data.stats.initiativeBonus)}
                context={"Initiative: Roll"}
                stats={defaultStats}
                statblock={getTokenName(item) ?? data.sheet}
                onRoll={async (rollResult) => {
                    let localInitiative = 0;
                    try {
                        if (rollResult && "total" in rollResult) {
                            localInitiative = rollResult.total;
                        } else if (rollResult && "total_value" in rollResult && isNumber(rollResult.total_value)) {
                            localInitiative = toInteger(rollResult.total_value);
                        } else if (rollResult && "values" in rollResult) {
                            localInitiative = rollResult.values.map((v) => v.value).reduce((a, b) => a + b, 0);
                        } else if (rollResult && "result" in rollResult) {
                            localInitiative = rollResult.result.totalValue;
                        }
                    } catch {}
                    setInitiative(localInitiative);
                }}
                classes={"init-wrapper"}
                customDiceThemeId={customDiceTheme}
            />

            <Tippy content={"Set initiative bonus"}>
                <input
                    type={"number"}
                    size={1}
                    value={initiativeBonus}
                    step={1}
                    onChange={(e) => {
                        setInitiativeBonus(Number(e.target.value));
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
