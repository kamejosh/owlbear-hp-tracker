import { useEffect, useState, useMemo } from "react";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { Autocomplete, TextField, Box, Typography, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { lootMetadataKey } from "../../helper/variables.ts";
import { LootMetadata } from "../../helper/types.ts";
import { useLootTokenContext } from "../../context/LootTokenContext.tsx";
import lootStyles from "./loot.module.scss";
import { usePlayerContext } from "../../context/PlayerContext.ts";

const RATES = {
    pp: 1000,
    gp: 100,
    ep: 50,
    sp: 10,
    cp: 1,
};

const toCP = (money: any): number => {
    if (!money) return 0;
    return (
        (Number(money.pp) || 0) * RATES.pp +
        (Number(money.gp) || 0) * RATES.gp +
        (Number(money.ep) || 0) * RATES.ep +
        (Number(money.sp) || 0) * RATES.sp +
        (Number(money.cp) || 0) * RATES.cp
    );
};

const formatCPShort = (totalCP: number): string => {
    if (totalCP === 0) return "0cp";
    let remaining = totalCP;
    const parts: string[] = [];

    if (remaining >= RATES.pp) {
        const amount = Math.floor(remaining / RATES.pp);
        parts.push(`${amount}pp`);
        remaining %= RATES.pp;
    }
    if (remaining >= RATES.gp) {
        const amount = Math.floor(remaining / RATES.gp);
        parts.push(`${amount}gp`);
        remaining %= RATES.gp;
    }
    if (remaining >= RATES.ep) {
        const amount = Math.floor(remaining / RATES.ep);
        parts.push(`${amount}ep`);
        remaining %= RATES.ep;
    }
    if (remaining >= RATES.sp) {
        const amount = Math.floor(remaining / RATES.sp);
        parts.push(`${amount}sp`);
        remaining %= RATES.sp;
    }
    if (remaining > 0) {
        parts.push(`${remaining}cp`);
    }

    return parts.join(" ");
};

type SortOption = "name" | "money" | "items";

export const LootTokenSelect = () => {
    const playerContext = usePlayerContext();
    const [tokens, setTokens] = useState<Array<Item>>([]);
    const setToken = useLootTokenContext((state) => state.setToken);
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [layerFilter, setLayerFilter] = useState<string>("ALL");
    const [moneyFilter, setMoneyFilter] = useState<boolean>(false);
    const [itemsFilter, setItemsFilter] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<SortOption>("name");

    useEffect(() => {
        const init = async () => {
            const allTokens = await OBR.scene.items.getItems((i) => ["CHARACTER", "PROP", "MOUNT"].includes(i.layer));
            setTokens(allTokens);
        };
        init();
        return OBR.scene.items.onChange((items) => {
            const filtered = items.filter((i) => ["CHARACTER", "PROP", "MOUNT"].includes(i.layer));
            setTokens(filtered);
        });
    }, []);

    const filteredAndSortedTokens = useMemo(() => {
        let result = [...tokens];

        if (typeFilter !== "ALL") {
            result = result.filter((t) => t.type === typeFilter);
        }

        if (layerFilter !== "ALL") {
            result = result.filter((t) => t.layer === layerFilter);
        }

        if (moneyFilter) {
            result = result.filter((t) => {
                const loot = t.metadata[lootMetadataKey] as LootMetadata | undefined;
                return loot && toCP(loot.money) > 0;
            });
        }

        if (itemsFilter) {
            result = result.filter((t) => {
                const loot = t.metadata[lootMetadataKey] as LootMetadata | undefined;
                return loot && loot.items && loot.items.length > 0;
            });
        }

        result.sort((a, b) => {
            if (sortBy === "name") {
                return a.name.localeCompare(b.name);
            } else if (sortBy === "money") {
                const lootA = a.metadata[lootMetadataKey] as LootMetadata | undefined;
                const lootB = b.metadata[lootMetadataKey] as LootMetadata | undefined;
                return toCP(lootB?.money) - toCP(lootA?.money);
            } else if (sortBy === "items") {
                const lootA = a.metadata[lootMetadataKey] as LootMetadata | undefined;
                const lootB = b.metadata[lootMetadataKey] as LootMetadata | undefined;
                const countA = lootA?.items?.reduce((acc, item) => acc + item.count, 0) || 0;
                const countB = lootB?.items?.reduce((acc, item) => acc + item.count, 0) || 0;
                return countB - countA;
            }
            return 0;
        });

        return result;
    }, [tokens, typeFilter, layerFilter, moneyFilter, itemsFilter, sortBy]);

    if (tokens.length === 0) {
        return <div className={lootStyles.noItems}>No tokens found in scene</div>;
    }

    if (playerContext.role === "Player") {
        return <div className={lootStyles.noItems}>No Item selected for looting</div>;
    }

    return (
        <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h6" className={lootStyles.sectionTitle}>
                Select Token for Loot
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel id="type-filter-label" className={lootStyles.filterLabel}>
                        Type
                    </InputLabel>
                    <Select
                        labelId="type-filter-label"
                        value={typeFilter}
                        label="Type"
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className={lootStyles.filterSelect}
                        MenuProps={{
                            PaperProps: {
                                sx: { bgcolor: "#222", color: "white" },
                            },
                        }}
                    >
                        <MenuItem value="ALL">All Types</MenuItem>
                        <MenuItem value="IMAGE">Image</MenuItem>
                        <MenuItem value="SHAPE">Shape</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel id="layer-filter-label" className={lootStyles.filterLabel}>
                        Layer
                    </InputLabel>
                    <Select
                        labelId="layer-filter-label"
                        value={layerFilter}
                        label="Layer"
                        onChange={(e) => setLayerFilter(e.target.value)}
                        className={lootStyles.filterSelect}
                        MenuProps={{
                            PaperProps: {
                                sx: { bgcolor: "#222", color: "white" },
                            },
                        }}
                    >
                        <MenuItem value="ALL">All Layers</MenuItem>
                        <MenuItem value="CHARACTER">Character</MenuItem>
                        <MenuItem value="PROP">Prop</MenuItem>
                        <MenuItem value="MOUNT">Mount</MenuItem>
                    </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel id="sort-by-label" className={lootStyles.filterLabel}>
                        Sort By
                    </InputLabel>
                    <Select
                        labelId="sort-by-label"
                        value={sortBy}
                        label="Sort By"
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className={lootStyles.filterSelect}
                        MenuProps={{
                            PaperProps: {
                                sx: { bgcolor: "#222", color: "white" },
                            },
                        }}
                    >
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="money">Money</MenuItem>
                        <MenuItem value="items">Items</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <label className={lootStyles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={moneyFilter}
                            onChange={(e) => setMoneyFilter(e.target.checked)}
                        />
                        Has Money
                    </label>
                    <label className={lootStyles.checkboxLabel}>
                        <input
                            type="checkbox"
                            checked={itemsFilter}
                            onChange={(e) => setItemsFilter(e.target.checked)}
                        />
                        Has Items
                    </label>
                </Box>
            </Box>

            <Autocomplete
                options={filteredAndSortedTokens}
                getOptionLabel={(option) => option.name}
                onChange={(_, value) => {
                    if (value) setToken(value);
                }}
                filterOptions={(options, { inputValue }) => {
                    return options.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()));
                }}
                renderOption={(props, option) => {
                    const { key, ...optionProps } = props as any;
                    const loot = option.metadata[lootMetadataKey] as LootMetadata | undefined;
                    const hasLoot = !!loot;
                    const totalCP = hasLoot ? toCP(loot.money) : 0;
                    const itemCount = hasLoot ? loot.items?.reduce((acc, item) => acc + item.count, 0) || 0 : 0;

                    return (
                        <Box component="li" key={option.id} {...optionProps} sx={{ display: "flex", gap: 1, py: 1 }}>
                            {option.type === "IMAGE" && (
                                <img
                                    src={(option as Image).image.url}
                                    alt=""
                                    style={{ width: 32, height: 32, objectFit: "contain" }}
                                />
                            )}
                            <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body1">{option.name}</Typography>
                                {hasLoot && (
                                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", opacity: 0.7 }}>
                                        <div
                                            className={`${lootStyles.statusDot} ${
                                                loot.lootAvailable ? lootStyles.lootable : lootStyles.locked
                                            }`}
                                            style={{ width: 6, height: 6 }}
                                        />
                                        <Typography variant="caption">
                                            {formatCPShort(totalCP)} | {itemCount} items
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    );
                }}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label="Search Tokens"
                        variant="outlined"
                        size="small"
                        className={lootStyles.autocompleteField}
                    />
                )}
            />
        </Box>
    );
};
