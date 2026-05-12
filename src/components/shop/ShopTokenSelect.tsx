import { useEffect, useState, useMemo } from "react";
import { useDebounceFn } from "ahooks";
import OBR, { Image, Item } from "@owlbear-rodeo/sdk";
import {
    TextField,
    Box,
    Typography,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Tooltip,
    IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { infoMetadataKey, shopMetadataKey } from "../../helper/variables.ts";
import { ShopMetadata } from "../../helper/types.ts";
import { useShopTokenContext } from "../../context/ShopTokenContext.tsx";
import shopStyles from "./shop.module.scss";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import Tippy from "@tippyjs/react";
import { handleOnPlayerDoubleClick, updateShopMetadata } from "../../helper/tokenHelper.ts";

type SortOption = "name" | "items";

export const ShopTokenSelect = () => {
    const playerContext = usePlayerContext();
    const [tokens, setTokens] = useState<Array<Item>>([]);
    const setToken = useShopTokenContext((state) => state.setToken);
    const [typeFilter, setTypeFilter] = useState<string>("ALL");
    const [layerFilter, setLayerFilter] = useState<string>("ALL");
    const [itemsFilter, setItemsFilter] = useState<boolean>(false);
    const [sortBy, setSortBy] = useState<SortOption>("name");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isWaiting, setIsWaiting] = useState(false);
    const { run: runSingleClick, cancel: cancelSingleClick } = useDebounceFn(
        (token: Item) => {
            setToken(token);
            setIsWaiting(false);
        },
        { wait: 200 },
    );

    const handleTokenClick = (token: Item) => {
        if (isWaiting) {
            cancelSingleClick();
            setIsWaiting(false);
            void handleOnPlayerDoubleClick(token.id);
        } else {
            setIsWaiting(true);
            runSingleClick(token);
        }
    };

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
                const shop = t.metadata[shopMetadataKey] as ShopMetadata | undefined;
                if (shop?.items?.some((item) => item.name.toLowerCase().includes(query))) return true;
                return false;
            });
        }

        if (typeFilter !== "ALL") {
            result = result.filter((t) => t.type === typeFilter);
        }

        if (layerFilter !== "ALL") {
            result = result.filter((t) => t.layer === layerFilter);
        }

        if (itemsFilter) {
            result = result.filter((t) => {
                const shop = t.metadata[shopMetadataKey] as ShopMetadata | undefined;
                return shop && shop.items && shop.items.length > 0;
            });
        }

        result.sort((a, b) => {
            if (sortBy === "name") {
                return a.name.localeCompare(b.name);
            } else if (sortBy === "items") {
                const shopA = a.metadata[shopMetadataKey] as ShopMetadata | undefined;
                const shopB = b.metadata[shopMetadataKey] as ShopMetadata | undefined;
                const countA = shopA?.items?.length || 0;
                const countB = shopB?.items?.length || 0;
                return countB - countA;
            }
            return 0;
        });

        return result.map((t) => {
            const shop = t.metadata[shopMetadataKey] as ShopMetadata | undefined;
            const matches: string[] = [];
            if (searchQuery.trim() !== "" && shop?.items) {
                const query = searchQuery.toLowerCase();
                shop.items.forEach((item) => {
                    if (item.name.toLowerCase().includes(query)) {
                        matches.push(item.name);
                    }
                });
            }
            return { token: t, matchedItems: matches };
        });
    }, [tokens, searchQuery, typeFilter, layerFilter, itemsFilter, sortBy]);

    if (tokens.length === 0) {
        return <div className={shopStyles.noItems}>No tokens found on the scene</div>;
    }

    if (playerContext.role === "Player") {
        return <div className={shopStyles.noItems}>No item selected for shopping</div>;
    }

    return (
        <Box sx={{ p: 0, display: "flex", flexDirection: "column", gap: 2 }}>
            <Typography variant="h6" className={shopStyles.sectionTitle}>
                Select a token to manage its shop
            </Typography>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel id="type-filter-label" className={shopStyles.filterLabel}>
                        Type
                    </InputLabel>
                    <Select
                        labelId="type-filter-label"
                        value={typeFilter}
                        label="Type"
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className={shopStyles.filterSelect}
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
                    <InputLabel id="layer-filter-label" className={shopStyles.filterLabel}>
                        Layer
                    </InputLabel>
                    <Select
                        labelId="layer-filter-label"
                        value={layerFilter}
                        label="Layer"
                        onChange={(e) => setLayerFilter(e.target.value)}
                        className={shopStyles.filterSelect}
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
                    <InputLabel id="sort-by-label" className={shopStyles.filterLabel}>
                        Sort By
                    </InputLabel>
                    <Select
                        labelId="sort-by-label"
                        value={sortBy}
                        label="Sort By"
                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                        className={shopStyles.filterSelect}
                        MenuProps={{
                            PaperProps: {
                                sx: { bgcolor: "#222", color: "white" },
                            },
                        }}
                    >
                        <MenuItem value="name">Name</MenuItem>
                        <MenuItem value="items">Items</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <label className={shopStyles.checkboxLabel}>
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
                className={shopStyles.searchField}
                fullWidth
            />

            <Box className={shopStyles.tokenList}>
                {filteredAndSortedTokens.length === 0 ? (
                    <Typography sx={{ p: 2, textAlign: "center", opacity: 0.5 }}>No tokens match filters</Typography>
                ) : (
                    filteredAndSortedTokens.map(({ token, matchedItems }) => {
                        const shop = token.metadata[shopMetadataKey] as ShopMetadata | undefined;
                        const hasShop = !!shop;
                        const itemCount = hasShop ? shop.items?.length || 0 : 0;

                        return (
                            <Box
                                key={token.id}
                                className={shopStyles.tokenListItem}
                                sx={{ display: "flex", gap: 1, p: 1, alignItems: "center" }}
                                onClick={() => handleTokenClick(token)}
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
                                    {hasShop && (
                                        <Box sx={{ display: "flex", gap: 1, alignItems: "center", opacity: 0.7 }}>
                                            <Typography variant="caption">
                                                {itemCount} items
                                            </Typography>
                                        </Box>
                                    )}
                                    {matchedItems.length > 0 && (
                                        <Box sx={{ mt: 0.5, opacity: 0.8 }}>
                                            <Typography
                                                variant="caption"
                                                sx={{ fontStyle: "italic", display: "block" }}
                                            >
                                                Found in shop:
                                            </Typography>
                                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                                                {matchedItems.map((itemName, i) => (
                                                    <span key={i} className={shopStyles.matchedItemHighlight}>
                                                        {itemName}
                                                    </span>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                                <Tooltip title={token.visible ? "Hide Token" : "Show Token"}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            void OBR.scene.items.updateItems([token.id], (items) => {
                                                for (const item of items) {
                                                    item.visible = !item.visible;
                                                }
                                            });
                                        }}
                                        sx={{ color: "white", opacity: token.visible ? 1 : 0.5 }}
                                    >
                                        {token.visible ? (
                                            <Visibility fontSize="small" />
                                        ) : (
                                            <VisibilityOff fontSize="small" />
                                        )}
                                    </IconButton>
                                </Tooltip>
                                {hasShop && (
                                    <Tippy
                                        content={
                                            shop.shopAvailable
                                                ? "Shop is open for players"
                                                : "Shop is closed for players"
                                        }
                                    >
                                        <button
                                            className={`${shopStyles.compactStatusButton} ${
                                                shop.shopAvailable ? shopStyles.lootable : shopStyles.locked
                                            }`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                void updateShopMetadata(
                                                    { ...shop, shopAvailable: !shop.shopAvailable },
                                                    [token.id],
                                                );
                                            }}
                                        >
                                            <span
                                                className={`${shopStyles.statusDot} ${
                                                    shop.shopAvailable ? shopStyles.lootable : shopStyles.locked
                                                }`}
                                            />
                                            {shop.shopAvailable ? "Open" : "Closed"}
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
