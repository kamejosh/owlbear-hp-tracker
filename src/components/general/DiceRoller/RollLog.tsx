import { DiceButton } from "./DiceButtonWrapper.tsx";
import { RollLogEntryType, useRollLogContext } from "../../../context/RollLogContext.tsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInterval } from "../../../helper/hooks.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import tippy from "tippy.js";
import { isObject } from "lodash";

type RollLogEntryProps = {
    entry: RollLogEntryType;
    classes?: string;
};

export const RollLog = () => {
    const log = useRollLogContext((state) => state.log);
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
    const detailsRef = useRef<HTMLDivElement>(null);

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

    useEffect(() => {
        if (detailsRef.current) {
            tippy(detailsRef.current, { content: getDetailedResult(), maxWidth: "100vw" });
        }
    }, [detailsRef]);

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
                    .map((v) => v.value)
                    .join(", ")
                    .replace(", +", " + ")
            );
        } else {
            return props.entry.values.join(", ").replaceAll(", +", " + ");
        }
    }, [props.entry.values]);

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

    return (
        <li
            className={`roll-log-entry ${props.classes} ${
                props.entry.owlbear_user_id === playerContext.id ||
                props.entry.participantUsername === playerContext.name
                    ? "self"
                    : ""
            }`}
        >
            <div className={"roll-time"}>{rollTimeText}</div>
            <div className={"roll-context"}>{formatLabel()}</div>
            <div className={"username"}>{props.entry.username}</div>
            <DiceButton
                dice={props.entry.equation}
                text={props.entry.equation}
                context={props.entry.label || "re-roll"}
                statblock={props.entry.username}
            />
            <div className={"roll-equation"}>{props.entry.equation}</div>
            <div ref={detailsRef} className={"detailed-result"}>
                {getDetailedResult()}
            </div>
            <div className={"divider"}>=</div>
            <div className={"total"}>{props.entry.total_value.toString()}</div>
        </li>
    );
};
