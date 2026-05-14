import { Image, Item } from "@owlbear-rodeo/sdk";
import { Box, Typography, Tooltip, IconButton, Badge } from "@mui/material";
import { Visibility, VisibilityOff, ShoppingCartCheckout } from "@mui/icons-material";
import Tippy from "@tippyjs/react";
import { ShopMetadata } from "../../helper/types.ts";
import { shopMetadataKey } from "../../helper/variables.ts";
import { updateShopMetadata } from "../../helper/tokenHelper.ts";
import shopStyles from "./shop.module.scss";
import { updateItems } from "../../helper/obrHelper.ts";

interface ShopTokenListItemProps {
    token: Item;
    matchedItems: string[];
    onClick: (token: Item) => void;
}

export const ShopTokenListItem = ({ token, matchedItems, onClick }: ShopTokenListItemProps) => {
    const shop = token.metadata[shopMetadataKey] as ShopMetadata | undefined;
    const hasShop = !!shop;
    const itemCount = hasShop ? shop.items?.length || 0 : 0;
    const activeCartCount = hasShop ? Object.keys(shop.cart || {}).length : 0;

    return (
        <Box
            className={shopStyles.tokenListItem}
            sx={{ display: "flex", gap: 1, p: 1, alignItems: "center" }}
            onClick={() => onClick(token)}
        >
            {token.type === "IMAGE" && (
                <img src={(token as Image).image.url} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} />
            )}
            <Box sx={{ flexGrow: 1 }}>
                <Typography variant="body1">{token.name}</Typography>
                {hasShop && (
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", opacity: 0.7 }}>
                        <Typography variant="caption">{itemCount} items</Typography>
                    </Box>
                )}
                {matchedItems.length > 0 && (
                    <Box sx={{ mt: 0.5, opacity: 0.8 }}>
                        <Typography variant="caption" sx={{ fontStyle: "italic", display: "block" }}>
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
                        void updateItems([token.id], (items) => {
                            for (const item of items) {
                                item.visible = !item.visible;
                            }
                        });
                    }}
                    sx={{ color: "white", opacity: token.visible ? 1 : 0.5 }}
                >
                    {token.visible ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                </IconButton>
            </Tooltip>
            {hasShop && (
                <>
                    {activeCartCount > 0 && (
                        <Tippy content={`Active carts: ${activeCartCount}`}>
                            <Box sx={{ mr: 1, display: "flex", alignItems: "center" }}>
                                <Badge
                                    badgeContent={activeCartCount}
                                    color="success"
                                    sx={{
                                        "& .MuiBadge-badge": {
                                            fontSize: "0.6rem",
                                            height: "16px",
                                            minWidth: "16px",
                                        },
                                    }}
                                >
                                    <ShoppingCartCheckout sx={{ fontSize: "1.2rem", opacity: 0.8 }} />
                                </Badge>
                            </Box>
                        </Tippy>
                    )}
                    <Tippy content={shop.shopAvailable ? "Shop is open for players" : "Shop is closed for players"}>
                        <button
                            className={`${shopStyles.compactStatusButton} ${
                                shop.shopAvailable ? shopStyles.lootable : shopStyles.locked
                            }`}
                            onClick={(e) => {
                                e.stopPropagation();
                                void updateShopMetadata({ ...shop, shopAvailable: !shop.shopAvailable }, [token.id]);
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
                </>
            )}
        </Box>
    );
};
