import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { IDiceRoll, Operator } from "dddice-js";
import { DiceSvg } from "../../svgs/DiceSvg.tsx";
import { useRollLogContext } from "../../../context/RollLogContext.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { dddiceRollToRollLog } from "../../../helper/helpers.ts";
import { useComponentContext } from "../../../context/ComponentContext.tsx";
import { useRef, useState } from "react";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { diceToRoll } from "../../../helper/diceHelper.ts";

type DiceButtonProps = {
    dice: string;
    text: string;
    context: string;
};
export const DiceButton = (props: DiceButtonProps) => {
    const { addRoll } = useRollLogContext();
    const { room } = useMetadataContext();
    const { roller, initialized } = useDiceRoller();
    const { component } = useComponentContext();
    const [context, setContext] = useState<boolean>(false);
    const rollButton = useRef<HTMLButtonElement>(null);
    const playerContext = usePlayerContext();

    const getUserUuid = async () => {
        if (room?.diceRoom?.slug) {
            const diceRoom = (await roller.api?.room.get(room?.diceRoom.slug))?.data;
            const user = (await roller.api?.user.get())?.data;
            if (user && diceRoom) {
                const participant = diceRoom.participants.find((p) => p.user.uuid === user.uuid);
                if (participant) {
                    return [participant.id];
                }
            }
        }
        return undefined;
    };

    const addModifier = (originalDie: string, baseDie: string) => {
        if (originalDie.includes("+")) {
            baseDie += `+${props.dice.split("+").pop()}`;
        }
        if (originalDie.includes("-")) {
            baseDie += `+${props.dice.split("-").pop()}`;
        }
        return baseDie;
    };

    const roll = async (modifier?: "ADV" | "DIS" | "SELF") => {
        const button = rollButton.current;
        const theme = room?.diceUser?.find((user) => user.playerId === playerContext.id)?.diceTheme;
        if (button && theme) {
            button.classList.add("rolling");
            let parsed: { dice: IDiceRoll[]; operator: Operator | undefined } | undefined;
            if (modifier && modifier === "ADV") {
                parsed = diceToRoll(addModifier(props.dice, "2d20kh1"), theme);
            } else if (modifier && modifier === "DIS") {
                parsed = diceToRoll(addModifier(props.dice, "2d20dh1"), theme);
            } else {
                parsed = diceToRoll(props.dice, theme);
            }
            if (parsed) {
                try {
                    const roll = await roller.roll(parsed.dice, {
                        label: props.context,
                        operator: parsed.operator,
                        external_id: component,
                        whisper: modifier === "SELF" ? await getUserUuid() : undefined,
                    });
                    if (roll && roll.data) {
                        const data = roll.data;
                        addRoll(await dddiceRollToRollLog(data, { owlbear_user_id: playerContext.id || undefined }));
                    }
                } catch {
                    console.warn("error in dice roll", parsed.dice, parsed.operator, component);
                }
            }
            button.classList.remove("rolling");
            button.blur();
        }
    };

    return (
        <div
            className={`button-wrapper ${initialized ? "enabled" : "disabled"}`}
            onMouseEnter={() => {
                setContext(true);
            }}
            onMouseLeave={() => setContext(false)}
        >
            <button
                ref={rollButton}
                disabled={!initialized}
                className={"dice-button button"}
                onClick={async () => {
                    await roll();
                }}
            >
                <DiceSvg />
                {props.text.replace(/\s/g, "")}
            </button>
            <div
                className={`dice-context-button ${context && initialized ? "visible" : ""} ${
                    props.dice.startsWith("1d20") ||
                    props.dice.startsWith("d20") ||
                    props.dice.startsWith("+") ||
                    props.dice.startsWith("-")
                        ? "full"
                        : "reduced"
                }`}
            >
                {props.dice.startsWith("1d20") ||
                props.dice.startsWith("d20") ||
                props.dice.startsWith("+") ||
                props.dice.startsWith("-") ? (
                    <>
                        <button
                            className={"advantage"}
                            disabled={!initialized}
                            onClick={async () => {
                                await roll("ADV");
                            }}
                        >
                            ADV
                        </button>
                        <button
                            className={"disadvantage"}
                            disabled={!initialized}
                            onClick={async () => {
                                await roll("DIS");
                            }}
                        >
                            DIS
                        </button>
                    </>
                ) : null}
                <button
                    className={"self"}
                    disabled={!initialized}
                    onClick={async () => {
                        await roll("SELF");
                    }}
                >
                    HIDE
                </button>
            </div>
        </div>
    );
};

export const DiceButtonWrapper = (text: string, context: string) => {
    const regex = /((\d+?d\d+)( ?[\+\-] ?\d+)?)|([\+\-]\d+)/gi;
    const dice = text.match(regex);
    dice?.forEach((die) => {
        text = text.split(die).join("|||");
    });
    const parts = text.split("|||");

    return (
        <span>
            {parts.map((part, index) => {
                let diceField = null;
                if (dice && dice.length >= index && dice[index]) {
                    let die = dice[index];
                    const text = die;
                    if (die.startsWith("DC")) {
                        die = `1d20>${parseInt(die.substring(3))}`;
                    }
                    diceField = <DiceButton dice={die} text={text} context={context} />;
                }
                return (
                    <span key={index}>
                        {part}
                        {diceField}
                    </span>
                );
            })}
        </span>
    );
};
