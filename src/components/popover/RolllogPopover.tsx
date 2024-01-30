import { ContextWrapper } from "../ContextWrapper.tsx";
import { useRollLogContext } from "../../context/RollLogContext.tsx";
import { RollLogEntry } from "../general/DiceRoller/RollLog.tsx";
import { useInterval } from "../../helper/hooks.ts";

export const RollLogPopover = () => {
    return (
        <ContextWrapper component={"rolllog"}>
            <Content />
        </ContextWrapper>
    );
};

const Content = () => {
    const { log } = useRollLogContext();

    useInterval(() => {
        useRollLogContext.persist.rehydrate();
    }, 1000);

    return (
        <div className={"roll-log popover"}>
            {log
                .sort((a, b) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .map((entry) => {
                    return <RollLogEntry entry={entry} />;
                })}
        </div>
    );
};
