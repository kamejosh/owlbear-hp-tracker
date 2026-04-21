import { GMGMetadata, LootItemType, LootMetadata } from "../../helper/types.ts";
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
import { useGetItem, useGetLoot } from "../../api/tabletop-almanac/useItem.ts";
import { Controller, useForm } from "react-hook-form";
import { AutoCompleteItemInput } from "../party/PartyInventory.tsx";
import { NumberInput, TextInput } from "../form/RHFInputs.tsx";
import Tippy from "@tippyjs/react";
import { SubmitButton } from "../form/SubmitButton.tsx";
import { CancelButton } from "../form/CancelButton.tsx";
import { ItemOut } from "../../helper/equipmentHelpers.ts";
import { updateLootMetadata } from "../../helper/tokenHelper.ts";
import { Item } from "@owlbear-rodeo/sdk";
import { DeleteButton } from "../form/DeleteButton.tsx";
import { useLootTokenContext } from "../../context/LootTokenContext.tsx";
import { Autocomplete, Chip, TextField } from "@mui/material";
import { Add } from "@mui/icons-material";
import { itemMetadataKey } from "../../helper/variables.ts";
import { usePartyStore } from "../../context/PartyStore.tsx";
import { useGetMultipleStatblocks } from "../../api/e5/useE5Api.ts";
import { useEffect, useMemo } from "react";

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
    const data = useLootTokenContext((state) => state.data);
    const token = useLootTokenContext((state) => state.token);
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
                <div className={lootStyles.itemMain}>
                    <span className={lootStyles.itemName}>{item.name}</span>
                    <span className={lootStyles.itemCount}>x{item.count}</span>
                </div>
                <DeleteButton
                    message={"Remove Item from Loot"}
                    onClick={async () => {
                        if (data && token) {
                            const currentItems = [...data.items];
                            currentItems.splice(
                                currentItems.findIndex((i) => i.id === item.id),
                                1,
                            );
                            await updateLootMetadata({ ...data, items: currentItems }, [token.id]);
                        }
                    }}
                />
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

const standardItemTypes = ["weapon", "wand", "wondrous item", "armor", "shield", "potion", "scroll", "staff", "ring"];

export const LootSuggestions = ({
    token,
    data,
    setOpen,
}: {
    token: Item;
    data: LootMetadata;
    setOpen: (state: boolean) => void;
}) => {
    const slug = itemMetadataKey in token.metadata ? (token.metadata[itemMetadataKey] as GMGMetadata).sheet : null;
    const party = usePartyStore((state) => state.currentParty);

    const partyQueries = useGetMultipleStatblocks(party);

    const avgLevel = useMemo(() => {
        const levels = partyQueries.map((q) => q.data?.cr).filter((cr): cr is number => typeof cr === "number");
        if (levels.length === 0) {
            return 1;
        }
        return levels.reduce((acc, level) => acc + level, 0) / levels.length;
    }, [partyQueries]);

    const form = useForm<{
        statblock_slug: string;
        avg_party_level: number;
        item_types: string[];
        max_items: number;
    }>({
        defaultValues: {
            statblock_slug: slug ?? "",
            avg_party_level: Math.round(avgLevel),
            item_types: [],
            max_items: 2,
        },
    });

    useEffect(() => {
        form.setValue("avg_party_level", Math.round(avgLevel));
    }, [avgLevel, form]);

    const getLootQuery = useGetLoot();
    const [suggestions, setSuggestions] = useState<Array<ItemOut>>([]);

    const handleSubmit = async (formData: {
        statblock_slug: string;
        avg_party_level: number;
        item_types: string[];
        max_items: number;
    }) => {
        try {
            const results = await getLootQuery.mutateAsync({
                statblock_slug: formData.statblock_slug || null,
                avg_party_level: formData.avg_party_level,
                item_types: formData.item_types.length > 0 ? formData.item_types : null,
                max_items: formData.max_items,
            });
            setSuggestions(results);
        } catch (e) {
            console.error(e);
        }
    };

    const addSuggestion = async (item: ItemOut) => {
        try {
            const newItem: LootItemType = {
                id: Date.now(),
                name: item.name,
                count: 1,
                slug: item.slug,
            };
            const updatedItems = [...data.items, newItem];
            await updateLootMetadata({ ...data, items: updatedItems }, [token.id]);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className={lootStyles.suggestionsContainer}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.addForm}>
                <div className={lootStyles.suggestionFormGrid}>
                    <div className={lootStyles.suggestionFormRow}>
                        <TextInput
                            form={form}
                            fieldName={"statblock_slug"}
                            label={"Statblock Slug"}
                            required={false}
                            disabled={true}
                            className={lootStyles.suggestionInput}
                        />
                    </div>
                    <div className={lootStyles.suggestionFormRow}>
                        <NumberInput
                            form={form}
                            fieldName={"avg_party_level"}
                            label={"Avg Party Level"}
                            required={true}
                            min={1}
                            max={20}
                            className={lootStyles.suggestionInput}
                        />
                    </div>
                    <div className={lootStyles.suggestionFormRow}>
                        <NumberInput
                            form={form}
                            fieldName={"max_items"}
                            label={"Max Items"}
                            required={true}
                            min={1}
                            max={50}
                            className={lootStyles.suggestionInput}
                        />
                    </div>
                </div>
                <div className={lootStyles.suggestionFormRow}>
                    <label className={lootStyles.suggestionLabel}>Limit by Item Types</label>
                    <Controller
                        name="item_types"
                        control={form.control}
                        render={({ field }) => (
                            <Autocomplete
                                multiple
                                freeSolo
                                options={standardItemTypes}
                                value={field.value}
                                onChange={(_, newValue) => field.onChange(newValue)}
                                renderTags={(value: string[], getTagProps) =>
                                    value.map((option: string, index: number) => {
                                        const { key, ...tagProps } = getTagProps({ index });
                                        return (
                                            <Chip
                                                key={key}
                                                variant="outlined"
                                                label={option}
                                                size="small"
                                                {...tagProps}
                                                sx={{ color: "white", borderColor: "rgba(255,255,255,0.2)" }}
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
                    <SubmitButton form={form} pending={getLootQuery.isPending} />
                    <CancelButton onClick={() => setOpen(false)} />
                </div>
            </form>

            {suggestions.length > 0 && (
                <div className={lootStyles.suggestionsList}>
                    <h3 className={lootStyles.suggestionsTitle}>Suggestions</h3>
                    {suggestions.map((item) => (
                        <div key={item.slug} className={lootStyles.suggestionItem}>
                            <div className={lootStyles.itemMain}>
                                <span className={lootStyles.itemName}>{item.name}</span>
                                <span className={lootStyles.itemMeta}>{item.rarity}</span>
                            </div>
                            <button className={lootStyles.addButton} onClick={() => addSuggestion(item)}>
                                <Add fontSize="small" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
