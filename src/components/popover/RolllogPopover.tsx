import { ContextWrapper } from "../ContextWrapper.tsx";
import { rollLogStore, useRollLogContext } from "../../context/RollLogContext.tsx";
import { RollLogEntry } from "../general/DiceRoller/RollLog.tsx";
import { useInterval } from "../../helper/hooks.ts";
import { useShallow } from "zustand/react/shallow";

export const RollLogPopover = () => {
    return (
        <ContextWrapper component={"rolllog"}>
            <Content />
        </ContextWrapper>
    );
};

const Content = () => {
    const log = useRollLogContext(useShallow((state) => state.log));

    useInterval(() => {
        rollLogStore.persist.rehydrate();
    }, 1000);

    return (
        <div className={"roll-log popover"}>
            {log
                .sort((a, b) => {
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
                })
                .map((entry, index) => {
                    return <RollLogEntry key={index} entry={entry} />;
                })}
        </div>
    );
};
