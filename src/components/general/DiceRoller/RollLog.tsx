import { DiceButton } from "./DiceButtonWrapper.tsx";
import { RollLogEntryType, useRollLogContext } from "../../../context/RollLogContext.tsx";
import { useState } from "react";
import { useInterval } from "../../../helper/hooks.ts";

export const RollLog = () => {
    const { log } = useRollLogContext();

    return (
        <ul className={"roll-log"}>
            {log.map((entry) => {
                return <RollLogEntry entry={entry} key={entry.uuid} />;
            })}
        </ul>
    );
};

export const RollLogEntry = ({ entry }: { entry: RollLogEntryType }) => {
    const rollTime = new Date(entry.created_at);
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

    return (
        <li className={"roll-log-entry"}>
            <span className={"roll-time"}>{rollTimeText}</span>
            <span className={"username"}>{entry.username}</span>
            <ul className={"dice"}>
                {entry.values.map((die, index) => {
                    return (
                        <li key={index} className={"die"}>
                            {die.type !== "mod" ? (
                                <DiceButton
                                    dice={"1" + die.type}
                                    text={"1" + die.type}
                                    context={entry.label || "custom roll"}
                                />
                            ) : (
                                "+ "
                            )}
                            {die.type !== "mod" ? `(${die.value})` : die.value}
                        </li>
                    );
                })}
            </ul>
            <span className={"total"}>= {entry.total_value.toString()}</span>
        </li>
    );
};
