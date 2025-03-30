import { DiceButton } from "./DiceButtonWrapper.tsx";
import { RollLogEntryType, useRollLogContext } from "../../../context/RollLogContext.tsx";
import { useCallback, useState } from "react";
import { useInterval } from "../../../helper/hooks.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { isObject } from "lodash";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";

type RollLogEntryProps = {
    entry: RollLogEntryType;
    classes?: string;
};

export const RollLog = () => {
    const log = useRollLogContext(useShallow((state) => state.log));
    const [numberOfEntries, setNumberOfEntries] = useState<number>(20);

    return (
        <ul className={"roll-log"}>
            {log
                .sort((a, b) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .slice(0, numberOfEntries)
                .map((entry, index) => {
                    return <RollLogEntry entry={entry} key={entry.uuid} classes={index > 4 ? "old-roll" : ""} />;
                })}
            {numberOfEntries < log.length ? (
                <button
                    className={"more"}
                    onClick={() => {
                        setNumberOfEntries(Math.min(numberOfEntries + 10, log.length));
                    }}
                >
                    more
                </button>
            ) : null}
        </ul>
    );
};

export const RollLogEntry = (props: RollLogEntryProps) => {
    const playerContext = usePlayerContext();
    const rollTime = new Date(props.entry.created_at);
    const now = new Date();
    const [hidden, setHidden] = useState<boolean>(props.entry.is_hidden);

    const ownRoll =
        props.entry.owlbear_user_id === playerContext.id || props.entry.participantUsername === playerContext.name;
    const deltaTime = now.getTime() - rollTime.getTime();

    const getRollTimeText = (delta: number) => {
        const msPerDay = 86400000;
        const msPerHour = 3600000;
        const msPerMinute = 60000;

        const days = Math.floor(delta / msPerDay);
        if (days > 0) {
            return `${days}d`;
        }
        const hours = Math.floor((delta % msPerDay) / msPerHour);
        if (hours > 0) {
            return `${hours}h`;
        }
        const minutes = Math.floor(((delta % msPerDay) % msPerHour) / msPerMinute);
        if (minutes > 0) {
            return `${minutes}m`;
        } else {
            return "now";
        }
    };

    const [rollTimeText, setRollTimeText] = useState<string>(getRollTimeText(deltaTime));

    useInterval(() => {
        const nowTime = new Date();
        setRollTimeText(getRollTimeText(nowTime.getTime() - rollTime.getTime()));
    }, 60000);

    const getDetailedResult = useCallback(() => {
        if (
            props.entry.values.length > 0 &&
            isObject(props.entry.values[0]) &&
            // @ts-ignore before the switch values had the property "value"
            props.entry.values[0].hasOwnProperty("value")
        ) {
            return (
                props.entry.values
                    // @ts-ignore before the switch values had the property "value"
                    .map((v) => (hidden ? "?" : v.value))
                    .join(", ")
                    .replace(", +", " + ")
            );
        } else {
            return props.entry.values
                .map((v) => (hidden ? "?" : v))
                .join(", ")
                .replaceAll(", +", " + ");
        }
    }, [props.entry.values, hidden]);

    const formatLabel = useCallback(() => {
        if (props.entry.label) {
            const parts = props.entry.label.split(":");
            if (parts.length === 2) {
                return (
                    <>
                        <span className={"label-name"}>{parts[0]}:</span>
                        <span className={`label-detail ${parts[1].trim().toLowerCase().replace(" ", "-")}`}>
                            {parts[1]}
                        </span>
                    </>
                );
            } else {
                return <span className={"label-name"}>{props.entry.label}</span>;
            }
        } else {
            return undefined;
        }
    }, [props.entry.label]);

    const detail = getDetailedResult();

    return (
        <li className={`roll-log-entry ${props.classes} ${ownRoll ? "self" : ""}`}>
            <div className={"roll-time"}>{rollTimeText}</div>
            <div className={"roll-context"}>{formatLabel()}</div>
            <div className={"username"}>{props.entry.username}</div>
            {props.entry.equation ? (
                <DiceButton
                    dice={props.entry.equation}
                    text={props.entry.equation}
                    stats={{ strength: 0, dexterity: 0, constitution: 0, intelligence: 0, wisdom: 0, charisma: 0 }}
                    context={props.entry.label || "re-roll"}
                    statblock={props.entry.username}
                />
            ) : null}
            <div className={"roll-equation"}>{props.entry.equation}</div>
            <Tippy content={detail} maxWidth={"100vw"}>
                <div className={"detailed-result"}>{detail}</div>
            </Tippy>

            {detail.length > 0 || props.entry.total_value.length > 0 ? <div className={"divider"}>=</div> : null}
            <div className={"total"}>{hidden ? "?" : String(props.entry.total_value)}</div>
            {props.entry.is_hidden && ownRoll ? (
                <button
                    className={"hide-toggle"}
                    onClick={() => {
                        setHidden(!hidden);
                    }}
                >
                    {hidden ? "unhide" : "hide"}
                </button>
            ) : null}
        </li>
    );
};
