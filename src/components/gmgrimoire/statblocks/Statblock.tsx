import { GMGMetadata } from "../../../helper/types.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { E5StatBlockWrapper } from "./e5/E5Statblock.tsx";
import { PFStatBlockWrapper } from "./pf/PfStatblock.tsx";
import { useShallow } from "zustand/react/shallow";

export const Statblock = ({ id }: { id: string }) => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const data = token?.data as GMGMetadata;

    return token ? (
        <div className={"statblock-wrapper"}>
            {room && room.ruleset === "e5" ? (
                <E5StatBlockWrapper slug={data.sheet} itemId={id} />
            ) : (
                <PFStatBlockWrapper slug={data.sheet} itemId={id} />
            )}
        </div>
    ) : null;
};
