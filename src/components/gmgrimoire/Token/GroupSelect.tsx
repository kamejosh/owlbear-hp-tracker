import { useShallow } from "zustand/react/shallow";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { GMGMetadata } from "../../../helper/types.ts";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import style from "./group-select.module.scss";
import OBR from "@owlbear-rodeo/sdk";
import { updateItems } from "../../../helper/obrHelper.ts";
import { itemMetadataKey } from "../../../helper/variables.ts";

export const GroupSelect = ({ id, onSelect, data }: { id: string; onSelect: () => void; data: GMGMetadata }) => {
    const [scene] = useMetadataContext(useShallow((state) => [state.scene]));

    return (
        <div className={style.groupSelect}>
            <b>Select Group for Token</b>
            <select
                value={data.group || "Default"}
                onChange={async (e) => {
                    const targetGroup = e.currentTarget.value;
                    const playerSelection = await OBR.player.getSelection();
                    if (playerSelection && playerSelection.length > 0) {
                        await updateItems(playerSelection, (items) => {
                            items.forEach((item) => {
                                const data = item.metadata[itemMetadataKey] as GMGMetadata;
                                if (data && data.hpTrackerActive) {
                                    data.group = targetGroup;
                                    item.metadata[itemMetadataKey] = { ...data };
                                }
                            });
                        });
                    } else {
                        void updateTokenMetadata({ ...data, group: targetGroup }, [id]);
                    }
                    onSelect();
                }}
            >
                {scene?.groups?.map((option, index) => {
                    return (
                        <option key={index} value={option}>
                            {option}
                        </option>
                    );
                })}
            </select>
        </div>
    );
};
