import { useDebounceFn, useLocalStorageState } from "ahooks";
import { ID } from "../../helper/variables.ts";
import { ChevronRight } from "@mui/icons-material";
import { usePartyStore } from "../../context/PartyStore.tsx";
import {
    PartyInventoryOut,
    PartyInventoryUpdate,
    useGetParty,
    useGetPartyInventory,
    useUpdatePartyInventory,
} from "../../api/tabletop-almanac/useParty.ts";
import { useEffect, useState } from "react";
import { ItemOut } from "../../helper/equipmentHelpers.ts";
import { useForm } from "react-hook-form";
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
import { useSearchItems } from "../../api/tabletop-almanac/useItem.ts";

export const AutoCompleteItemInput = (props: { error: string; onSelect: (value: number, item: ItemOut) => void }) => {
    const [search, setSearch] = useState<string | undefined>();
    const [items, setItems] = useState<Array<ItemOut>>();
    const searchItemQuery = useSearchItems();
    const [selected, setSelected] = useState<ItemOut>();

    const searchItems = useDebounceFn(
        async (newValue: string) => {
            setItems(await searchItemQuery.mutateAsync({ search: newValue || "" }));
        },
        { wait: 300 },
    );

    const comboBox = useCombobox({
        items: items || [],
        getItemValue: (item: ItemOut | null) => item?.name || "",
        value: search !== selected?.id ? search : selected?.name,
        onChange: async (newValue) => {
            setSearch(newValue);
            await searchItems.run(newValue ?? "");
        },
        selected,
        onSelectChange: (s) => {
            setSelected(s);
            if (s) {
                props.onSelect(s.id, s);
            }
        },
        feature: autocomplete({
            select: true,
        }),
    });

    return (
        <div className={styles.wrap} style={{ flexGrow: 1, minWidth: "200px" }}>
            <div className={styles.inputWrap}>
                <input
                    className={props.error ? `${styles.input} input-error` : styles.input}
                    placeholder="Type to search..."
                    {...comboBox.getInputProps()}
                />
            </div>

            {comboBox.open && items && (
                <ul className={styles.list} {...comboBox.getListProps()}>
                    {items.length ? (
                        items.map((item, index) => {
                            return (
                                <li
                                    key={item.slug}
                                    className={
                                        item.source === username ? `${styles.spell} ${styles.custom}` : styles.spell
                                    }
                                    style={{
                                        background: comboBox.focusIndex === index ? "#444" : "none",
                                        textDecoration: selected === item ? "underline" : "none",
                                    }}
                                    {...comboBox.getItemProps({ item, index })}
                                >
                                    <Tippy content={item.name}>
                                        <span>{item.name}</span>
                                    </Tippy>
                                    <span>
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
                                    <span>{item.rarity}</span>
                                    <span className={"source"}>{item.source}</span>
                                </li>
                            );
                        })
                    ) : (
                        <li className={styles.noResult}>No result</li>
                    )}
                </ul>
            )}
        </div>
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
        <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div
                style={{ display: "flex", gap: "10px", alignItems: "flex-end", justifyContent: "stretch" }}
                ref={refs.setReference}
                {...getReferenceProps()}
            >
                <AutoCompleteItemInput
                    error={""}
                    onSelect={(itemId, item) => {
                        form.setValue("new_items.0.item_id", itemId);
                        setItem(item);
                        console.log(itemId);
                    }}
                />
                <NumberInput form={form} fieldName={"new_items.0.count"} label={"Count"} required={true} />
            </div>
            <div
                style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "10px" }}
                className={"button-group"}
            >
                <button
                    className={"button delete"}
                    type={"button"}
                    onClick={() => setAddItem(false)}
                    style={{ marginTop: "10px" }}
                >
                    Cancel
                </button>
                <SubmitButton form={form} pending={updatePartyInventory.isPending} />
            </div>
            {isOpen && item && (
                <FloatingPortal>
                    <div
                        ref={refs.setFloating}
                        style={{
                            ...floatingStyles,
                            backgroundColor: "#2b2a33dd",
                            border: "1px solid #ddd",
                            padding: "8px",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            zIndex: 100,
                        }}
                        {...getFloatingProps()}
                    >
                        <ItemComponent item={item} />
                    </div>
                </FloatingPortal>
            )}
        </form>
    );
};

export const PartyInventory = () => {
    const currentParty = usePartyStore((state) => state.currentParty);

    const [partyId, _] = useState<number | undefined>(currentParty?.id);
    const [inventoryId, setInventoryId] = useState<number | undefined>(undefined);
    const [addItem, setAddItem] = useState<boolean>(false);

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

    if (currentParty && inventory?.items?.length === 0) {
        return (
            <div>
                <h4>No items in inventory</h4>
                {addItem ? (
                    <AddInventoryItem partyId={partyId} inventoryId={inventoryId} setAddItem={setAddItem} />
                ) : (
                    <button className={"add-button"} onClick={() => setAddItem(true)}>
                        Add Item
                    </button>
                )}
            </div>
        );
    }

    if (currentParty && inventory)
        return (
            <div>
                <div style={{ display: "flex", gap: "1ch", alignItems: "center", justifyContent: "space-between" }}>
                    <h3>Inventory</h3>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ display: "flex", gap: "1ch", alignItems: "center" }}
                    >
                        <ChevronRight sx={{ rotate: collapsed ? "0deg" : "90deg", transition: "all 0.25s ease" }} />
                    </button>
                </div>
                {collapsed ? null : (
                    <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "1ch", flexDirection: "column" }}>
                        {inventory.items?.map((item) => {
                            return (
                                <li
                                    key={item.id}
                                    style={{
                                        textAlign: "left",
                                        borderRadius: "8px",
                                        padding: "5px 24px",
                                    }}
                                >
                                    {item.count}x {item.item.name}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        );
};
