import { LimitComponent } from "../LimitComponent.tsx";
import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { ItemOut } from "../../../../helper/equipmentHelpers.ts";
import styles from "./item-charges.module.scss";

export const ItemCharges = ({ equippedItem, showReset }: { equippedItem: ItemOut; showReset?: boolean }) => {
    const { data, item } = useE5StatblockContext();
    const limitValues = data.stats.limits?.find((l) => l.id === equippedItem?.charges?.name);
    return (
        <>
            {equippedItem?.charges && limitValues ? (
                <div className={styles.itemCharges}>
                    Charges:
                    <LimitComponent
                        limit={equippedItem.charges}
                        title={"none"}
                        hideReset={!showReset}
                        hideDescription={true}
                        limitValues={limitValues}
                        itemId={item.id}
                    />
                </div>
            ) : null}
        </>
    );
};
