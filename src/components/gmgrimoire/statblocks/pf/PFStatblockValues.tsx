import { HP } from "../../Token/HP.tsx";
import { Initiative } from "../../Token/Initiative.tsx";
import styles from "./statblock-values.module.scss";
import { usePFStatblockContext } from "../../../../context/PFStatblockContext.tsx";

export const PFStatblockValues = () => {
    const { item } = usePFStatblockContext();

    return (
        <div className={styles.values}>
            <HP id={item.id} />
            <Initiative id={item.id} />
        </div>
    );
};
