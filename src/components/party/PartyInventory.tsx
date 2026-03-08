import { useDebounceFn, useLocalStorageState } from "ahooks";
import { ID } from "../../helper/variables.ts";
import { ChevronRight } from "@mui/icons-material";
import { usePartyStore } from "../../context/PartyStore.tsx";
import {
    PartyInventoryOut,
    PartyInventoryUpdate,
    PartyItemOut,
    useGetParty,
    useGetPartyInventory,
    useUpdatePartyInventory,
} from "../../api/tabletop-almanac/useParty.ts";
import { useEffect, useMemo, useState } from "react";
import { ItemOut, StatblockItems } from "../../helper/equipmentHelpers.ts";
import { useForm } from "react-hook-form";
import {
    autoUpdate,
    flip,
    FloatingPortal,
    offset,
    safePolygon,
    shift,
    useFloating,
    useHover,
    useInteractions,
} from "@floating-ui/react";
import { useSearchItems } from "../../api/tabletop-almanac/useItem.ts";
import Tippy from "@tippyjs/react";
import { Autocomplete, TextField } from "@mui/material";
import { NumberInput } from "../form/RHFInputs.tsx";
import { SubmitButton } from "../form/SubmitButton.tsx";
import { DeleteButton } from "../form/DeleteButton.tsx";
import { EditButton } from "../form/EditButton.tsx";
import styles from "./party-inventory.module.scss";
import { CancelButton } from "../form/CancelButton.tsx";

export const AutoCompleteItemInput = (props: { error: string; onSelect: (value: number, item: ItemOut) => void }) => {
    const [items, setItems] = useState<Array<ItemOut>>([]);
    const searchItemQuery = useSearchItems();
    const [selected, setSelected] = useState<ItemOut | null>(null);

    const searchItems = useDebounceFn(
        async (newValue: string) => {
            setItems(await searchItemQuery.mutateAsync({ search: newValue || "" }));
        },
        { wait: 300 },
    );

    return (
        <Autocomplete
            style={{ flexGrow: 1, minWidth: "200px", backgroundColor: "#2b2a33", color: "white" }}
            options={items}
            getOptionLabel={(option) => option.name}
            filterOptions={(x) => x}
            value={selected}
            onChange={(_, newValue) => {
                setSelected(newValue);
                if (newValue) {
                    props.onSelect(newValue.id, newValue);
                }
            }}
            onInputChange={(_, newInputValue) => {
                searchItems.run(newInputValue);
            }}
            slotProps={{
                paper: {
                    sx: {
                        backgroundColor: "#2b2a33",
                        color: "white",
                        "& .MuiAutocomplete-option:hover": {
                            backgroundColor: "#121212",
                        },
                    },
                },
            }}
            renderInput={(params) => (
                <TextField
                    {...params}
                    error={!!props.error}
                    placeholder="Type to search..."
                    size="small"
                    sx={{
                        "& .MuiInputBase-root": {
                            color: "white",
                        },
                    }}
                />
            )}
            renderOption={(props, item) => {
                const { key, ...optionProps } = props as any;
                return (
                    <li key={item.slug} {...optionProps}>
                        <div className={styles.autoCompleteOption}>
                            <div className={styles.optionMain}>
                                <Tippy content={item.name}>
                                    <span className={styles.itemName}>{item.name}</span>
                                </Tippy>
                                <span className={styles.optionIndicators}>
                                    {item.stats ? (
                                        <Tippy content={"Item is sentient"}>
                                            <span>S</span>
                                        </Tippy>
                                    ) : null}
                                    {item.bonus ? (
                                        <Tippy content={"Item provides bonuses"}>
                                            <span>B</span>
                                        </Tippy>
                                    ) : null}
                                    {item.modifiers ? (
                                        <Tippy content={"Item modifies stats"}>
                                            <span>M</span>
                                        </Tippy>
                                    ) : null}
                                </span>
                            </div>
                            <div className={styles.optionMeta}>
                                <span>{item.rarity}</span>
                                <span className={"source"}>{item.source}</span>
                            </div>
                        </div>
                    </li>
                );
            }}
        />
    );
};

const AddInventoryItem = ({
    partyId,
    inventoryId,
    setAddItem,
}: {
    partyId: number;
    inventoryId: number;
    setAddItem: (state: boolean) => void;
}) => {
    const updatePartyInventory = useUpdatePartyInventory(partyId, inventoryId);
    const form = useForm<PartyInventoryUpdate>({ defaultValues: { new_items: [] } });
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

    const handleSubmit = async (data: PartyInventoryUpdate) => {
        try {
            await updatePartyInventory.mutateAsync(data);
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
                        form.setValue("new_items.0.item_id", itemId);
                        setItem(item);
                        console.log(itemId);
                    }}
                />
                <Tippy content={"Count of items to add"}>
                    <NumberInput
                        form={form}
                        fieldName={"new_items.0.count"}
                        label={"Count"}
                        required={true}
                        className={styles.addItemCount}
                    />
                </Tippy>
            </div>
            <div className={styles.buttonGroup}>
                <SubmitButton form={form} pending={updatePartyInventory.isPending} />
                <CancelButton onClick={() => setAddItem(false)} />
            </div>
            {isOpen && item && (
                <div
                    ref={refs.setFloating}
                    className={styles.floatingInfo}
                    {...getFloatingProps()}
                    style={{ ...floatingStyles }}
                >
                    {/*TODO <ItemComponent item={item} />*/}
                    Hier kommt das item rein
                </div>
            )}
        </form>
    );
};

export const EditItemCount = ({
    item,
    partyId,
    inventoryId,
    setEditItem,
}: {
    item: PartyItemOut;
    partyId: number;
    inventoryId: number;
    setEditItem: (state: boolean) => void;
}) => {
    const updatePartyInventory = useUpdatePartyInventory(partyId, inventoryId);
    const form = useForm<PartyInventoryUpdate>({
        defaultValues: { item_updates: [{ item_id: item.item.id, count: item.count }] },
    });

    const handleSubmit = async (data: PartyInventoryUpdate) => {
        try {
            await updatePartyInventory.mutateAsync(data);
            setEditItem(false);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <form className={styles.editItemForm} onSubmit={form.handleSubmit(handleSubmit)}>
            <NumberInput form={form} fieldName={"item_updates.0.count"} label={"Count"} required={true} />
            <SubmitButton form={form} pending={updatePartyInventory.isPending} />
            <CancelButton onClick={() => setEditItem(false)} />
        </form>
    );
};

export const PartyInventoryItem = ({
    item,
    partyId,
    inventoryId,
}: {
    item: PartyItemOut;
    partyId: number;
    inventoryId: number;
}) => {
    const updatePartyInventory = useUpdatePartyInventory(partyId, inventoryId);
    const [editItem, setEditItem] = useState<boolean>(false);

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

    return (
        <div className={styles.inventoryItem}>
            <div className={styles.itemMain}>
                {editItem ? (
                    <EditItemCount item={item} partyId={partyId} inventoryId={inventoryId} setEditItem={setEditItem} />
                ) : (
                    <span>{item.count} x </span>
                )}
                <>
                    <div className={styles.itemInfo}>
                        <b ref={refs.setReference} {...getReferenceProps()} className={styles.itemName}>
                            {item.item.name}
                        </b>
                        <span className={styles.itemMeta}>
                            {item.item.rarity} - {item.item.source}
                        </span>
                    </div>
                    {item.item.cost ? (
                        <div className={styles.itemCost}>
                            {item.item.cost.pp ? (
                                <span className={`${styles.costItem} ${styles.pp}`}>{item.item.cost.pp}PP</span>
                            ) : null}
                            {item.item.cost.gp ? (
                                <span className={`${styles.costItem} ${styles.gp}`}>{item.item.cost.gp}GP</span>
                            ) : null}
                            {item.item.cost.ep ? (
                                <span className={`${styles.costItem} ${styles.ep}`}>{item.item.cost.ep}EP</span>
                            ) : null}
                            {item.item.cost.sp ? (
                                <span className={`${styles.costItem} ${styles.sp}`}>{item.item.cost.sp}SP</span>
                            ) : null}
                            {item.item.cost.cp ? (
                                <span className={`${styles.costItem} ${styles.cp}`}>{item.item.cost.cp}CP</span>
                            ) : null}
                        </div>
                    ) : null}
                </>
            </div>

            <div className={styles.actions}>
                <EditButton onClick={() => setEditItem(!editItem)} alignCenter={true} />
                <DeleteButton
                    message={`Do you want to delete ${item.item.name}`}
                    onClick={async () => {
                        await updatePartyInventory.mutateAsync({
                            item_updates: [{ item_id: item.item.id, count: 0 }],
                        });
                    }}
                />
            </div>
            {isOpen && (
                <FloatingPortal>
                    <div
                        ref={refs.setFloating}
                        className={styles.floatingInfo}
                        {...getFloatingProps()}
                        style={{ ...floatingStyles }}
                    >
                        {/*TODO <ItemComponent item={item.item} />*/}
                    </div>
                </FloatingPortal>
            )}
        </div>
    );
};

type Rarity = "Common" | "Uncommon" | "Rare" | "Very Rare" | "Unique" | "Legendary" | "Artifact";

const RarityOrder: Record<Rarity, number> = {
    Common: 0,
    Uncommon: 1,
    Rare: 2,
    "Very Rare": 3,
    Unique: 4,
    Legendary: 5,
    Artifact: 6,
};

export const sortInventory = (
    a: PartyItemOut | StatblockItems,
    b: PartyItemOut | StatblockItems,
    sort: "name" | "rarity",
) => {
    if (sort === "name") {
        if (a.item.name < b.item.name) return -1;
        if (a.item.name > b.item.name) return 1;
    } else if (sort === "rarity") {
        if (a.item.rarity && b.item.rarity) {
            return RarityOrder[a.item.rarity] - RarityOrder[b.item.rarity];
        } else if (a.item.rarity) {
            return -1;
        } else if (b.item.rarity) {
            return 1;
        }
    }
    return 0;
};

export const PartyInventoryItems = ({ inventory }: { inventory: PartyInventoryOut }) => {
    const currentParty = usePartyStore((state) => state.currentParty);
    const [addItem, setAddItem] = useState<boolean>(false);
    const [sort, setSort] = useState<"name" | "rarity">("name");

    const weight = useMemo(() => {
        if (inventory && inventory.items) {
            return inventory.items.reduce((acc, item) => acc + (item.item.weight ?? 0), 0);
        } else {
            return null;
        }
    }, [inventory]);

    if (currentParty && inventory?.items?.length === 0) {
        return (
            <div className={styles.emptyState}>
                <h4>No items in inventory</h4>
                {addItem ? (
                    <AddInventoryItem partyId={inventory.party_id} inventoryId={inventory.id} setAddItem={setAddItem} />
                ) : (
                    <button className={styles.addButton} onClick={() => setAddItem(true)}>
                        Add Item
                    </button>
                )}
            </div>
        );
    }

    if (currentParty && inventory)
        return (
            <div className={styles.inventoryContainer}>
                <div className={styles.controls}>
                    <select
                        className={styles.select}
                        onChange={(e) => setSort(e.target.value as "name" | "rarity")}
                        value={sort}
                    >
                        <option value={"name"}>Sort by name</option>
                        <option value={"rarity"}>Sort by rarity</option>
                    </select>
                    {weight ? <p>Weight: {weight}</p> : null}
                </div>
                <div className={styles.inventoryList}>
                    {inventory?.items
                        ?.sort((a, b) => sortInventory(a, b, sort))
                        .map((item) => {
                            return (
                                <PartyInventoryItem
                                    key={item.id}
                                    item={item}
                                    partyId={inventory.party_id}
                                    inventoryId={inventory.id}
                                />
                            );
                        })}
                </div>
                {addItem ? (
                    <AddInventoryItem partyId={inventory.party_id} inventoryId={inventory.id} setAddItem={setAddItem} />
                ) : (
                    <button className={styles.addButton} onClick={() => setAddItem(true)}>
                        + Add Item
                    </button>
                )}
            </div>
        );
};

export const PartyInventory = () => {
    const currentParty = usePartyStore((state) => state.currentParty);

    const [partyId, _] = useState<number | undefined>(currentParty?.id);
    const [inventoryId, setInventoryId] = useState<number | undefined>(undefined);

    const partyQuery = useGetParty(partyId);
    const partyInventoryQuery = useGetPartyInventory(partyId, inventoryId);

    useEffect(() => {
        if (partyQuery.isSuccess) {
            setInventoryId(partyQuery.data.inventory?.id);
        }
    }, [partyQuery.isSuccess]);

    const inventory: PartyInventoryOut = partyInventoryQuery.isSuccess ? partyInventoryQuery.data : null;

    const [collapsed, setCollapsed] = useLocalStorageState<boolean>(`${ID}.party.inventory.collapsed`, {
        defaultValue: false,
    });

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    gap: "1ch",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <h3>Inventory</h3>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ display: "flex", gap: "1ch", alignItems: "center" }}
                >
                    <ChevronRight sx={{ rotate: collapsed ? "0deg" : "90deg", transition: "all 0.25s ease" }} />
                </button>
            </div>
            {collapsed ? null : <PartyInventoryItems inventory={inventory} />}
        </div>
    );
};
