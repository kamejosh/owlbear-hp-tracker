import { LootItemType, LootMetadata } from "../../helper/types.ts";
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
import { useForm } from "react-hook-form";
import { AutoCompleteItemInput } from "../party/PartyInventory.tsx";
import { NumberInput } from "../form/RHFInputs.tsx";
import Tippy from "@tippyjs/react";
import { SubmitButton } from "../form/SubmitButton.tsx";
import { CancelButton } from "../form/CancelButton.tsx";
import { ItemOut } from "../../helper/equipmentHelpers.ts";
import { updateLootMetadata } from "../../helper/tokenHelper.ts";
import { Item } from "@owlbear-rodeo/sdk";

export const AddLootItem = ({
    token,
    data,
    setAddItem,
}: {
    token: Item;
    data: LootMetadata;
    setAddItem: (state: boolean) => void;
}) => {
    const form = useForm<{ item_id: number; count: number }>({ defaultValues: { count: 1 } });
    const [item, setItem] = useState<ItemOut | null>(null);

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

    const handleSubmit = async (formData: { item_id: number; count: number }) => {
        if (!item) return;
        try {
            const newItem: LootItemType = {
                id: Date.now(),
                name: item.name,
                count: formData.count,
                slug: item.slug,
            };
            const updatedItems = [...data.items, newItem];
            await updateLootMetadata({ ...data, items: updatedItems }, [token.id]);
            setAddItem(false);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.addForm}>
            <div className={styles.addFormRow} ref={refs.setReference} {...getReferenceProps()}>
                <AutoCompleteItemInput
                    error={""}
                    onSelect={(itemId, item) => {
                        form.setValue("item_id", itemId);
                        setItem(item);
                    }}
                />
                <Tippy content={"Count of items to add"}>
                    <NumberInput
                        form={form}
                        fieldName={"count"}
                        label={"Count"}
                        required={true}
                        className={styles.addItemCount}
                    />
                </Tippy>
            </div>
            <div className={styles.buttonGroup}>
                <SubmitButton form={form} pending={false} />
                <CancelButton onClick={() => setAddItem(false)} />
            </div>
            {isOpen && item && (
                <div
                    ref={refs.setFloating}
                    className={styles.floatingInfo}
                    {...getFloatingProps()}
                    style={{ ...floatingStyles }}
                >
                    <ItemHover item={item} />
                </div>
            )}
        </form>
    );
};

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
