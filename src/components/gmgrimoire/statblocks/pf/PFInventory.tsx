import { usePFStatblockContext } from "../../../../context/PFStatblockContext.tsx";
import styles from "../e5/statblock-inventory.module.scss";
import { FancyLineBreak } from "../../../general/LineBreak.tsx";

export const PFInventory = () => {
    const { statblock } = usePFStatblockContext();

    return (
        <div>
            <h3 className={styles.heading}>Inventory</h3>
            <FancyLineBreak />
            <ul>
                {statblock.items?.map((i, index) => {
                    return <li key={index}>{i}</li>;
                })}
            </ul>
        </div>
    );
};
