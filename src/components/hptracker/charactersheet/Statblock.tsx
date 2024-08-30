import { HpTrackerMetadata } from "../../../helper/types.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { E5StatBlock } from "./e5/E5Statblock.tsx";
import { PfStatBlock } from "./pf/PfStatblock.tsx";

export const Statblock = ({ id }: { id: string }) => {
    const room = useMetadataContext((state) => state.room);
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const data = token?.data as HpTrackerMetadata;

    return (
        <div className={"statblock-wrapper"}>
            {room && room.ruleset === "e5" ? (
                <E5StatBlock slug={data.sheet} itemId={id} />
            ) : (
                <PfStatBlock slug={data.sheet} name={data.name} itemId={id} />
            )}
        </div>
    );
};
