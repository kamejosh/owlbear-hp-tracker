import { useState } from "react";
import shopStyles from "./shop.module.scss";
import partyStyles from "../party/party-inventory.module.scss";
import { MoneyDisplay } from "../money/MoneyDisplay.tsx";
import { setNullToZero } from "../../helper/moneyHelpers.ts";
import { ShopSellItemType } from "../../helper/types.ts";
import { StatblockItems } from "../../helper/equipmentHelpers.ts";
import { ItemHover } from "../gmgrimoire/items/ItemHover.tsx";
import { Sell } from "@mui/icons-material";
import { autoUpdate, flip, offset, safePolygon, shift, useFloating, useHover, useInteractions } from "@floating-ui/react";

const SellRow = ({
    equipmentItem,
    remaining,
    onAddToSell,
}: {
    equipmentItem: StatblockItems;
    remaining: number;
    onAddToSell: (item: StatblockItems, count: number) => void;
}) => {
    const [count, setCount] = useState(1);
    const [isOpen, setIsOpen] = useState(false);

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

    if (remaining <= 0) return null;

    const clampedCount = Math.min(count, remaining);

    return (
        <>
            <div className={shopStyles.itemRow}>
                <div className={shopStyles.itemMain} ref={refs.setReference} {...getReferenceProps()}>
                    <span className={shopStyles.itemName}>{equipmentItem.item.name}</span>
                    <MoneyDisplay money={setNullToZero(equipmentItem.item.cost ?? {})} className={shopStyles.itemPrice} />
                    <span className={shopStyles.itemCount}>You have: {remaining}</span>
                </div>
                <div className={shopStyles.itemActions}>
                    <input
                        type="number"
                        min={1}
                        max={remaining}
                        value={clampedCount}
                        onChange={(e) => {
                            const value = Number(e.target.value);
                            setCount(Math.min(Math.max(1, value || 1), remaining));
                        }}
                        className={shopStyles.sellCountInput}
                    />
                    <button
                        className={shopStyles.addButton}
                        onClick={() => onAddToSell(equipmentItem, clampedCount)}
                    >
                        <Sell fontSize="small" />
                    </button>
                </div>
            </div>
            {isOpen && (
                <div ref={refs.setFloating} className={partyStyles.floatingInfo} {...getFloatingProps()} style={{ ...floatingStyles }}>
                    <ItemHover item={equipmentItem.item} />
                </div>
            )}
        </>
    );
};

export const ShopPlayerSell = ({
    equipment,
    cart,
    onAddToSell,
}: {
    equipment: StatblockItems[];
    cart: { sellItems?: Array<ShopSellItemType> } | null;
    onAddToSell: (item: StatblockItems, count: number) => void;
}) => {
    if (equipment.length === 0) {
        return <div className={shopStyles.noItems}>You have no items to sell</div>;
    }

    return (
        <div className={shopStyles.itemsList}>
            {[...equipment]
                .sort((a, b) => a.item.name.localeCompare(b.item.name))
                .map((equipmentItem) => {
                    const queued = (cart?.sellItems ?? [])
                        .filter((i) => i.id === equipmentItem.item.id)
                        .reduce((acc, i) => acc + i.count, 0);
                    const remaining = (equipmentItem.count ?? 1) - queued;

                    return (
                        <SellRow
                            key={equipmentItem.id}
                            equipmentItem={equipmentItem}
                            remaining={remaining}
                            onAddToSell={onAddToSell}
                        />
                    );
                })}
        </div>
    );
};
