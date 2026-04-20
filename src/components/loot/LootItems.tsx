import { LootItemType } from "../../helper/types.ts";
import lootStyles from "./loot.module.scss";
import { useState } from "react";
import {
    autoUpdate,
    flip,
    offset,
    safePolygon,
    shift,
    useFloating,
    useHover,
    useInteractions,
} from "@floating-ui/react";
import styles from "../party/party-inventory.module.scss";
import { ItemHover } from "../gmgrimoire/items/ItemHover.tsx";
import { useGetItem } from "../../api/tabletop-almanac/useItem.ts";

export const LootItem = ({ item }: { item: LootItemType }) => {
    const [isOpen, setIsOpen] = useState(false);

    const itemQuery = useGetItem(item.slug);

    const taItem = itemQuery.isSuccess ? itemQuery.data : null;

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        placement: "top",
        middleware: [offset(10), flip(), shift()],
    });

    const hover = useHover(context, {
        handleClose: safePolygon(),
        delay: { open: 200, close: 100 },
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    return (
        <>
            <div className={lootStyles.itemRow} ref={refs.setReference} {...getReferenceProps()}>
                <span className={lootStyles.itemName}>{item.name}</span>
                <span className={lootStyles.itemCount}>x{item.count}</span>
            </div>
            {isOpen && taItem && (
                <div
                    ref={refs.setFloating}
                    className={styles.floatingInfo}
                    {...getFloatingProps()}
                    style={{ ...floatingStyles }}
                >
                    <ItemHover item={taItem} />
                </div>
            )}
        </>
    );
};

export const LootItems = ({ items }: { items: Array<LootItemType> }) => {
    return (
        <>
            {items.map((item) => {
                return <LootItem item={item} key={item.id} />;
            })}
        </>
    );
};
