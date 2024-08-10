import OBR from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../../helper/variables.ts";
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
            <div className={"initiative-bonus"}>
                {"Initiative Bonus"}
                <input
                    type={"text"}
                    size={1}
                    value={data.stats.initiativeBonus}
                    onChange={async (e) => {
                        const factor = e.target.value.startsWith("-") ? -1 : 1;
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        const newData: HpTrackerMetadata = {
                            ...data,
                            stats: { ...data.stats, initiativeBonus: factor * value },
                        };

                        await OBR.scene.items.updateItems([id], (items) => {
                            items.forEach((item) => {
                                item.metadata[itemMetadataKey] = { ...newData };
                            });
                        });
                    }}
                />
            </div>
            {room && room.ruleset === "e5" ? (
                <E5StatBlock slug={data.sheet} itemId={id} />
            ) : (
                <PfStatBlock slug={data.sheet} name={data.name} />
            )}
        </div>
    );
};
