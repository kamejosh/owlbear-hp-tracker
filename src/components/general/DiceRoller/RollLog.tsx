import { DiceButton } from "./DiceButtonWrapper.tsx";
import { RollLogEntryType, useRollLogContext } from "../../../context/RollLogContext.tsx";
import { useCallback, useState } from "react";
import { useInterval } from "../../../helper/hooks.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";

type RollLogEntryProps = {
    entry: RollLogEntryType;
    classes?: string;
};

export const RollLog = () => {
    const { log } = useRollLogContext();

    return (
        <ul className={"roll-log"}>
            {log
                .sort((a, b) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .map((entry, index) => {
                    return <RollLogEntry entry={entry} key={entry.uuid} classes={index > 4 ? "old-roll" : ""} />;
                })}
        </ul>
    );
};

export const RollLogEntry = (props: RollLogEntryProps) => {
    const playerContext = usePlayerContext();
    const rollTime = new Date(props.entry.created_at);
    const now = new Date();

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
    }, 10000);

    const getDetailedResult = useCallback(() => {
        let result = "";
        props.entry.values.forEach((value) => {
            result += Intl.NumberFormat("en-US", { signDisplay: "always" }).format(Math.floor(value.value));
        });
        if (result.length > 0) {
            result = result.substring(1, result.length);
        }
        return result;
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
                props.entry.owlbear_user_id === playerContext.id ? "self" : ""
            }`}
        >
            <div className={"roll-time"}>{rollTimeText}</div>
            <div className={"roll-context"}>{formatLabel()}</div>
            <div className={"username"}>{props.entry.username}</div>
            <DiceButton
                dice={props.entry.equation}
                text={props.entry.equation}
                context={props.entry.label || "re-roll"}
            />
            <div className={"roll-equation"}>{props.entry.equation}</div>
            <div className={"detailed-result"}>{getDetailedResult()}</div>
            <div className={"divider"}>=</div>
            <div className={"total"}>{props.entry.total_value.toString()}</div>
        </li>
    );
};
