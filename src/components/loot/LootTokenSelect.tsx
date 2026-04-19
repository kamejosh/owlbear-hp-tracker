import { useEffect, useState, useMemo } from "react";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import { TextField, Box, Typography, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { infoMetadataKey, itemMetadataKey, lootMetadataKey } from "../../helper/variables.ts";
import { GMGMetadata, LootMetadata } from "../../helper/types.ts";
import { useLootTokenContext } from "../../context/LootTokenContext.tsx";
import lootStyles from "./loot.module.scss";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import Tippy from "@tippyjs/react";
import { updateLootMetadata } from "../../helper/tokenHelper.ts";

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
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        const init = async () => {
            const allTokens = await OBR.scene.items.getItems(
                (i) => ["CHARACTER", "PROP", "MOUNT"].includes(i.layer) && !(infoMetadataKey in i.metadata),
            );
            setTokens(allTokens);
        };
        init();
        return OBR.scene.items.onChange((items) => {
            const filtered = items.filter(
                (i) => ["CHARACTER", "PROP", "MOUNT"].includes(i.layer) && !(infoMetadataKey in i.metadata),
            );
            setTokens(filtered);
        });
    }, []);

    const filteredAndSortedTokens = useMemo(() => {
        let result = [...tokens];

        const query = searchQuery.toLowerCase().trim();
        if (query !== "") {
            result = result.filter((t) => {
                if (t.name.toLowerCase().includes(query)) return true;
                const loot = t.metadata[lootMetadataKey] as LootMetadata | undefined;
                if (loot?.items?.some((item) => item.name.toLowerCase().includes(query))) return true;
                return false;
            });
        }

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

        return result.map((t) => {
            const loot = t.metadata[lootMetadataKey] as LootMetadata | undefined;
            const matches: string[] = [];
            if (searchQuery.trim() !== "" && loot?.items) {
                const query = searchQuery.toLowerCase();
                loot.items.forEach((item) => {
                    if (item.name.toLowerCase().includes(query)) {
                        matches.push(item.name);
                    }
                });
            }
            return { token: t, matchedItems: matches };
        });
    }, [tokens, searchQuery, typeFilter, layerFilter, moneyFilter, itemsFilter, sortBy]);

    if (tokens.length === 0) {
        return <div className={lootStyles.noItems}>No tokens found in scene</div>;
    }

    if (playerContext.role === "Player") {
        return <div className={lootStyles.noItems}>No Item selected for looting</div>;
    }

    return (
        <Box sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2 }}>
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

            <TextField
                label="Search Tokens"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={lootStyles.searchField}
                fullWidth
            />

            <Box className={lootStyles.tokenList}>
                {filteredAndSortedTokens.length === 0 ? (
                    <Typography sx={{ p: 2, textAlign: "center", opacity: 0.5 }}>No tokens match filters</Typography>
                ) : (
                    filteredAndSortedTokens.map(({ token, matchedItems }) => {
                        const loot = token.metadata[lootMetadataKey] as LootMetadata | undefined;
                        const hasLoot = !!loot;
                        const totalCP = hasLoot ? toCP(loot.money) : 0;
                        const itemCount = hasLoot ? loot.items?.reduce((acc, item) => acc + item.count, 0) || 0 : 0;

                        return (
                            <Box
                                key={token.id}
                                className={lootStyles.tokenListItem}
                                sx={{ display: "flex", gap: 1, p: 1, alignItems: "center" }}
                                onClick={() => setToken(token)}
                            >
                                {token.type === "IMAGE" && (
                                    <img
                                        src={(token as Image).image.url}
                                        alt=""
                                        style={{ width: 32, height: 32, objectFit: "contain" }}
                                    />
                                )}
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="body1">{token.name}</Typography>
                                    {hasLoot && (
                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", opacity: 0.7 }}>
                                            <Typography variant="caption">
                                                {formatCPShort(totalCP)} | {itemCount} items
                                            </Typography>
                                        </Box>
                                    )}
                                    {matchedItems.length > 0 && (
                                        <Box sx={{ mt: 0.5, opacity: 0.8 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{ fontStyle: "italic", display: "block" }}
                                            >
                                                Found in:
                                            </Typography>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                {matchedItems.map((itemName, i) => (
                                                    <span key={i} className={lootStyles.matchedItemHighlight}>
                                                        {itemName}
                                                    </span>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                                {hasLoot && (
                                    <Tippy
                                        content={
                                            loot.lootAvailable
                                                ? "Looting is enabled for players"
                                                : "Looting is disabled for players"
                                        }
                                    >
                                        <button
                                            className={`${lootStyles.compactStatusButton} ${
                                                loot.lootAvailable ? lootStyles.lootable : lootStyles.locked
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                void updateLootMetadata(
                                                    { ...loot, lootAvailable: !loot.lootAvailable },
                                                    [token.id],
                                                );
                                            }}
                                        >
                                            <span
                                                className={`${lootStyles.statusDot} ${
                                                    loot.lootAvailable ? lootStyles.lootable : lootStyles.locked
                                                }`}
                                            />
                                            {loot.lootAvailable ? "Lootable" : "Locked"}
                                        </button>
                                    </Tippy>
                                )}
                            </Box>
                        );
                    })
                )}
            </Box>
        </Box>
    );
};
