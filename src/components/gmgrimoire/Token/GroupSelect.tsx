import { useShallow } from "zustand/react/shallow";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { GMGMetadata } from "../../../helper/types.ts";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import style from "./group-select.module.scss";

export const GroupSelect = ({ id, onSelect, data }: { id: string; onSelect: () => void; data: GMGMetadata }) => {
    const [scene] = useMetadataContext(useShallow((state) => [state.scene]));

    return (
        <div className={style.groupSelect}>
            <b>Select Group for Token</b>
            <select
                value={data.group || "Default"}
                onChange={(e) => {
                    onSelect();
                    void updateTokenMetadata({ ...data, group: e.currentTarget.value }, [id]);
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
