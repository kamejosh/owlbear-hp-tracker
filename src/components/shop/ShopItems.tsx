import { MoneyEditInputs } from "../money/MoneyEditInputs.tsx";
import { Money, ShopItemType, ShopMetadata } from "../../helper/types.ts";
import shopStyles from "./shop.module.scss";
import { useState } from "react";
import { MoneyDisplay } from "../money/MoneyDisplay.tsx";
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
import { ShopRequest, useGetItem, useGetItemTypes, useGetShopItems } from "../../api/tabletop-almanac/useItem.ts";
import { Controller, useForm, UseFormReturn } from "react-hook-form";
import { AutoCompleteItemInput } from "../party/PartyInventory.tsx";
import { NumberInput, SelectInput } from "../form/RHFInputs.tsx";
import { SubmitButton } from "../form/SubmitButton.tsx";
import { CancelButton } from "../form/CancelButton.tsx";
import { ItemOut } from "../../helper/equipmentHelpers.ts";
import { updateShopMetadata } from "../../helper/tokenHelper.ts";
import { Item } from "@owlbear-rodeo/sdk";
import { DeleteButton } from "../form/DeleteButton.tsx";
import { EditButton } from "../form/EditButton.tsx";
import { Autocomplete, Chip, TextField, Tooltip } from "@mui/material";
import { Add } from "@mui/icons-material";
import { usePartyStore } from "../../context/PartyStore.tsx";
import { useGetMultipleStatblocks } from "../../api/e5/useE5Api.ts";
import { useEffect, useMemo } from "react";
import { normalizeToCP, setNullToZero } from "../../helper/moneyHelpers.ts";

type AddItemFormType = {
    item_id: number;
    count?: number;
    money: Money;
};

const addItem = async (item: ItemOut, token: Item, count: number = 1) => {
    try {
        await updateShopMetadata(
            (currentData) => {
                const existingItem = currentData.items.find((i) => i.id === item.id);
                let updatedItems: ShopItemType[];
                if (existingItem) {
                    updatedItems = currentData.items.map((i) =>
                        i.id === item.id ? { ...i, count: (i.count ?? 0) + count } : i,
                    );
                } else {
                    const newItem: ShopItemType = {
                        id: item.id,
                        name: item.name,
                        money: item.cost ? setNullToZero(item.cost) : { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
                        count: count,
                        slug: item.slug,
                    };
                    updatedItems = [...currentData.items, newItem];
                }
                return { ...currentData, items: updatedItems };
            },
            [token.id],
        );
    } catch (e) {
        console.error(e);
    }
};

const ShopItemForm = ({
    form,
    onSubmit,
    onCancel,
    itemInput,
    countTooltip,
    originalMoney,
}: {
    form: UseFormReturn<AddItemFormType>;
    onSubmit: (formData: AddItemFormType) => Promise<void>;
    onCancel: () => void;
    itemInput: React.ReactNode;
    countTooltip: string;
    originalMoney: Money | undefined;
}) => {
    const [error, setError] = useState<string | null>(null);

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.addForm}>
            {error && (
                <div
                    style={{
                        backgroundColor: "rgba(255, 0, 0, 0.1)",
                        color: "#ff4444",
                        padding: "8px",
                        borderRadius: "4px",
                        marginBottom: "8px",
                        fontSize: "0.8rem",
                        textAlign: "center",
                        border: "1px solid rgba(255, 0, 0, 0.2)",
                    }}
                >
                    {error}
                </div>
            )}
            <div className={shopStyles.itemInput}>
                {itemInput}
                <div className={shopStyles.suggestionFormRow}>
                    <Tooltip title={countTooltip} arrow placement="top-start">
                        <label className={shopStyles.suggestionLabel}>Count</label>
                    </Tooltip>
                    <NumberInput
                        form={form}
                        fieldName={"count"}
                        label={"Count"}
                        required={false}
                        className={shopStyles.addItemCount}
                    />
                </div>
            </div>
            <div className={shopStyles.suggestionFormRow}>
                <label className={shopStyles.suggestionLabel}>Price</label>
                <div className={styles.moneyEditForm}>
                    <MoneyEditInputs form={form} basePath="money" originalMoney={originalMoney} onError={setError} />
                </div>
            </div>
            <div className={styles.buttonGroup}>
                <SubmitButton form={form} pending={form.formState.isSubmitting} />
                <CancelButton onClick={onCancel} />
            </div>
        </form>
    );
};

export const EditShopItem = ({
    item,
    token,
    setEdit,
}: {
    item: ShopItemType;
    token: Item;
    setEdit: (state: boolean) => void;
}) => {
    const form = useForm<AddItemFormType>({
        defaultValues: {
            item_id: item.id,
            count: item.count ?? 1,
            money: { ...item.money },
        },
    });

    const handleSubmit = async (formData: AddItemFormType) => {
        await updateShopMetadata(
            (currentData) => {
                const updatedItems = currentData.items.map((i) =>
                    i.id === item.id ? { ...i, count: formData.count, money: formData.money } : i,
                );
                return { ...currentData, items: updatedItems };
            },
            [token.id],
        );
        setEdit(false);
    };

    return (
        <ShopItemForm
            form={form}
            onSubmit={handleSubmit}
            onCancel={() => setEdit(false)}
            countTooltip="Number of items in stock"
            originalMoney={item.money}
            itemInput={
                <div className={shopStyles.suggestionFormRow}>
                    <Tooltip title="Item Name (Read Only)" arrow placement="top-start">
                        <label className={shopStyles.suggestionLabel}>Item</label>
                    </Tooltip>
                    <TextField
                        value={item.name}
                        disabled
                        size="small"
                        variant="standard"
                        sx={{
                            "& .MuiInputBase-root": {
                                color: "white",
                                borderRadius: "4px",
                                "&:before, &:after": { display: "none" },
                            },
                            "& .MuiInputBase-input": {
                                paddingLeft: "4px !important",
                                color: "white",
                                "&.Mui-disabled": {
                                    WebkitTextFillColor: "rgba(255, 255, 255, 0.7)",
                                },
                            },
                        }}
                    />
                </div>
            }
        />
    );
};

export const AddShopItem = ({ token, setAddItem }: { token: Item; setAddItem: (state: boolean) => void }) => {
    const form = useForm<AddItemFormType>({
        defaultValues: {
            count: 1,
            money: {
                pp: 0,
                gp: 0,
                ep: 0,
                sp: 0,
                cp: 0,
            },
        },
    });
    const [item, setItem] = useState<ItemOut | null>(null);

    const handleSubmit = async (formData: AddItemFormType) => {
        if (!item) return;

        await addItem({ ...item, cost: { ...formData.money, id: item.cost?.id ?? 0 } }, token, formData.count);
        setAddItem(false);
    };

    return (
        <ShopItemForm
            form={form}
            onSubmit={handleSubmit}
            onCancel={() => setAddItem(false)}
            countTooltip="Number of items to add to stock"
            originalMoney={item?.cost ? setNullToZero(item.cost) : undefined}
            itemInput={
                <div className={shopStyles.suggestionFormRow}>
                    <Tooltip title="Search for an item to add to the shop" arrow placement="top-start">
                        <label className={shopStyles.suggestionLabel}>Item</label>
                    </Tooltip>
                    <AutoCompleteItemInput
                        error={""}
                        onSelect={(itemId, item) => {
                            form.setValue("item_id", itemId);
                            setItem(item);
                            if (item?.cost) {
                                form.setValue("money.pp", item.cost.pp || 0);
                                form.setValue("money.gp", item.cost.gp || 0);
                                form.setValue("money.ep", item.cost.ep || 0);
                                form.setValue("money.sp", item.cost.sp || 0);
                                form.setValue("money.cp", item.cost.cp || 0);
                            }
                        }}
                    />
                </div>
            }
        />
    );
};

export const ShopSuggestions = ({ token, setOpen }: { token: Item; setOpen: (state: boolean) => void }) => {
    const party = usePartyStore((state) => state.currentParty);

    const partyQueries = useGetMultipleStatblocks(party);
    const itemTypesQuery = useGetItemTypes();

    const avgLevel = useMemo(() => {
        const levels = partyQueries.map((q) => q.data?.cr).filter((cr): cr is number => typeof cr === "number");
        if (levels.length === 0) {
            return 1;
        }
        return levels.reduce((acc, level) => acc + level, 0) / levels.length;
    }, [partyQueries]);

    const form = useForm<ShopRequest>({
        defaultValues: {
            shop_type: null,
            avg_party_level: Math.round(avgLevel),
            item_types: [],
            max_items: 10,
        },
    });

    const itemTypes = itemTypesQuery.isSuccess ? itemTypesQuery.data : [];

    useEffect(() => {
        form.setValue("avg_party_level", Math.round(avgLevel));
    }, [avgLevel, form]);

    const getShopQuery = useGetShopItems();
    const [suggestions, setSuggestions] = useState<Array<ItemOut>>([]);

    const handleSuggest = async (formData: ShopRequest) => {
        try {
            const items = await getShopQuery.mutateAsync(formData);
            setSuggestions(items);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className={shopStyles.suggestionsContainer}>
            <form onSubmit={form.handleSubmit(handleSuggest)} className={styles.addForm}>
                <div className={shopStyles.suggestionFormGrid}>
                    <div className={shopStyles.suggestionFormRow}>
                        <label className={shopStyles.suggestionLabel}>Shop Type</label>
                        <SelectInput
                            form={form}
                            fieldName={"shop_type"}
                            className={shopStyles.suggestionInput}
                            label={"Shop Type"}
                            required={false}
                            options={[
                                { key: "alchemist", value: "Alchemist" },
                                { key: "blacksmith", value: "Blacksmith" },
                                { key: "general", value: "General Store" },
                                { key: "magic", value: "Magic Items" },
                            ]}
                        />
                    </div>
                    <div className={shopStyles.suggestionFormRow}>
                        <label className={shopStyles.suggestionLabel}>Avg Level</label>
                        <NumberInput
                            form={form}
                            fieldName={"avg_party_level"}
                            label={"Avg Party Level"}
                            required={false}
                            min={1}
                            max={20}
                            className={shopStyles.suggestionInput}
                        />
                    </div>
                    <div className={shopStyles.suggestionFormRow}>
                        <label className={shopStyles.suggestionLabel}>Max Items</label>
                        <NumberInput
                            form={form}
                            fieldName={"max_items"}
                            label={"Max Items"}
                            required={false}
                            min={1}
                            max={50}
                            className={shopStyles.suggestionInput}
                        />
                    </div>
                </div>
                <div className={shopStyles.suggestionFormRow}>
                    <label className={shopStyles.suggestionLabel}>Additional Item Types</label>
                    <Controller
                        name="item_types"
                        control={form.control}
                        render={({ field }) => (
                            <Autocomplete
                                loading={itemTypesQuery.isLoading}
                                multiple
                                options={itemTypes}
                                value={field.value || []}
                                onChange={(_, newValue) => field.onChange(newValue)}
                                renderValue={(value: string[], getItemProps) =>
                                    value.map((option: string, index: number) => {
                                        const { key, ...tagProps } = getItemProps({ index });
                                        return (
                                            <Chip
                                                key={key}
                                                variant="outlined"
                                                label={option}
                                                size="small"
                                                {...tagProps}
                                                sx={{
                                                    color: "white",
                                                    borderColor: "rgba(255,255,255,0.2)",
                                                    "& .MuiChip-deleteIcon": {
                                                        color: "rgba(255, 255, 255, 0.7)",
                                                        "&:hover": {
                                                            color: "white",
                                                        },
                                                    },
                                                }}
                                            />
                                        );
                                    })
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Add types..."
                                        size="small"
                                        variant="standard"
                                        sx={{
                                            "& .MuiInputBase-root": {
                                                color: "white",
                                                borderRadius: "4px",
                                                "&:before, &:after": { display: "none" },
                                            },
                                            "& .MuiInputBase-input": {
                                                paddingLeft: "4px !important",
                                                color: "white",
                                            },
                                        }}
                                    />
                                )}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            backgroundColor: "#2b2a33",
                                            color: "white",
                                            "& .MuiAutocomplete-option:hover": { backgroundColor: "#121212" },
                                        },
                                    },
                                }}
                            />
                        )}
                    />
                </div>
                <div className={styles.buttonGroup}>
                    <SubmitButton form={form} pending={getShopQuery.isPending} />
                    <CancelButton onClick={() => setOpen(false)} />
                </div>
            </form>

            {suggestions.length > 0 && (
                <div className={shopStyles.suggestionsList}>
                    <h3 className={shopStyles.suggestionsTitle}>Suggestions</h3>
                    {suggestions.map((item) => (
                        <div key={item.slug} className={shopStyles.suggestionItem}>
                            <div className={shopStyles.itemMain}>
                                <span className={shopStyles.itemName}>{item.name}</span>
                                <span className={shopStyles.itemMeta}>{item.rarity}</span>
                            </div>
                            <button className={shopStyles.addButton} onClick={() => addItem(item, token)}>
                                <Add fontSize="small" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ShopItem = ({
    item,
    token,
    readOnly = false,
    onAddToCart,
}: {
    item: ShopItemType;
    token: Item;
    data: ShopMetadata;
    readOnly?: boolean;
    onAddToCart?: (item: ShopItemType) => void;
}) => {
    const { data: taItem } = useGetItem(item.slug);
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
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

    const removeItem = async () => {
        await updateShopMetadata(
            (currentData) => {
                const updatedItems = currentData.items.filter((i) => i.id !== item.id);
                const updatedCarts = { ...currentData.cart };

                Object.keys(updatedCarts).forEach((cartId) => {
                    const cart = updatedCarts[cartId];
                    const itemsToRemove = cart.items.filter((i) => i.id === item.id);
                    if (itemsToRemove.length > 0) {
                        const remainingItems = cart.items.filter((i) => i.id !== item.id);
                        const newPrice = { ...cart.price };
                        itemsToRemove.forEach((removedItem) => {
                            newPrice.pp = (newPrice.pp || 0) - (removedItem.money.pp || 0);
                            newPrice.gp = (newPrice.gp || 0) - (removedItem.money.gp || 0);
                            newPrice.ep = (newPrice.ep || 0) - (removedItem.money.ep || 0);
                            newPrice.sp = (newPrice.sp || 0) - (removedItem.money.sp || 0);
                            newPrice.cp = (newPrice.cp || 0) - (removedItem.money.cp || 0);
                        });
                        updatedCarts[cartId] = { ...cart, items: remainingItems, price: normalizeToCP(newPrice) };
                    }
                });

                return { ...currentData, items: updatedItems, cart: updatedCarts };
            },
            [token.id],
        );
    };

    if (isEditing) {
        return <EditShopItem item={item} token={token} setEdit={setIsEditing} />;
    }

    return (
        <>
            <div className={shopStyles.itemRow}>
                <div className={shopStyles.itemMain} ref={refs.setReference} {...getReferenceProps()}>
                    <span className={shopStyles.itemName}>{item.name}</span>
                    <MoneyDisplay money={item.money} className={shopStyles.itemPrice} />
                    {item.count !== undefined && <span className={shopStyles.itemCount}>Stock: {item.count}</span>}
                </div>
                <div className={shopStyles.itemActions}>
                    {onAddToCart && (
                        <button className={shopStyles.addButton} onClick={() => onAddToCart(item)}>
                            <Add />
                        </button>
                    )}
                    {!readOnly && (
                        <>
                            <EditButton alignCenter={true} onClick={() => setIsEditing(true)} />
                            <DeleteButton message={"Remove from shop"} onClick={removeItem} />
                        </>
                    )}
                </div>
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

export const ShopItems = ({
    items,
    token,
    data,
    readOnly = false,
    onAddToCart,
}: {
    items: ShopItemType[];
    token: Item;
    data: ShopMetadata;
    readOnly?: boolean;
    onAddToCart?: (item: ShopItemType) => void;
}) => {
    return (
        <div className={shopStyles.itemsList}>
            {items
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((item) => (
                    <ShopItem
                        key={item.id}
                        item={item}
                        token={token}
                        data={data}
                        readOnly={readOnly}
                        onAddToCart={onAddToCart}
                    />
                ))}
        </div>
    );
};
