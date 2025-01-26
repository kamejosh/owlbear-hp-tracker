import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { HP } from "../../Token/HP.tsx";
import { Initiative } from "../../Token/Initiative.tsx";
import styles from "./statblock-values.module.scss";

export const E5StatblockValues = () => {
    const { item } = useE5StatblockContext();

    return (
        <div className={styles.values}>
            <HP id={item.id} />
            <Initiative id={item.id} />
        </div>
    );
};
