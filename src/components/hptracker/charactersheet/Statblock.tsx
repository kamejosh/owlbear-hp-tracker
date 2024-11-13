import { GMGMetadata } from "../../../helper/types.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { E5StatBlock } from "./e5/E5Statblock.tsx";
import { PfStatBlock } from "./pf/PfStatblock.tsx";
import { Image } from "@owlbear-rodeo/sdk";
import { getTokenName } from "../../../helper/helpers.ts";
import { useShallow } from "zustand/react/shallow";

export const Statblock = ({
    id,
    setScrollTargets,
}: {
    id: string;
    setScrollTargets?: (scrollTargets: Array<{ name: string; target: string }>) => void;
}) => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMGMetadata;
    const item = token?.item as Image;

    return token ? (
        <div className={"statblock-wrapper"}>
            {room && room.ruleset === "e5" ? (
                <E5StatBlock slug={data.sheet} itemId={id} setScrollTargets={setScrollTargets} />
            ) : (
                <PfStatBlock
                    slug={data.sheet}
                    name={getTokenName(item)}
                    itemId={id}
                    setScrollTargets={setScrollTargets}
                />
            )}
        </div>
    ) : null;
};
