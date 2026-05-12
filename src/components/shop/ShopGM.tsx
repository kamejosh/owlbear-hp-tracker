import { useShopTokenContext } from "../../context/ShopTokenContext.tsx";
import { useState } from "react";
import { updateShopMetadata } from "../../helper/tokenHelper.ts";
import shopStyles from "./shop.module.scss";
import { defaultShop } from "../../helper/variables.ts";
import { ShopItems, AddShopItem, ShopSuggestions } from "./ShopItems.tsx";
import { ShopCarts } from "./ShopCarts.tsx";
import { ShopFunds } from "./ShopFunds.tsx";
import { AddCircleOutline, AutoFixHigh } from "@mui/icons-material";
import Tippy from "@tippyjs/react";
import { ShopHeader } from "./ShopHeader.tsx";

export const ShopGM = () => {
    const data = useShopTokenContext((state) => state.data);
    const token = useShopTokenContext((state) => state.token);
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);

    if (!token) {
        return <div>No token selected for shop</div>;
    }

    if (!data) {
        return (
            <>
                <ShopHeader />
                <div className={shopStyles.initContainer}>
                    Initialize Shop for Token:{" "}
                    <button
                        className={"button"}
                        onClick={() => {
                            void updateShopMetadata(defaultShop, [token.id]);
                        }}
                    >
                        Initialize
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <ShopHeader showStatus={true} />
            <div className={shopStyles.section}>
                <div className={shopStyles.sectionHeader}>
                    <h2 className={shopStyles.sectionTitle}>Inventory</h2>
                    <div className={shopStyles.actions}>
                        <Tippy content={"Shop Suggestions"}>
                            <button className={shopStyles.addButton} onClick={() => setIsSuggesting(!isSuggesting)}>
                                <AutoFixHigh />
                            </button>
                        </Tippy>
                        <Tippy content={"Add Item"}>
                            <button className={shopStyles.addButton} onClick={() => setIsAddingItem(true)}>
                                <AddCircleOutline />
                            </button>
                        </Tippy>
                    </div>
                </div>
                {isSuggesting && <ShopSuggestions token={token} data={data} setOpen={setIsSuggesting} />}
                {isAddingItem && <AddShopItem token={token} data={data} setAddItem={setIsAddingItem} />}
                <ShopItems items={data.items} token={token} data={data} />
            </div>

            <ShopFunds />

            <div className={shopStyles.section + " " + shopStyles.last}>
                <div className={shopStyles.sectionHeader}>
                    <h2 className={shopStyles.sectionTitle}>Active Carts</h2>
                </div>
                <ShopCarts token={token} data={data} />
            </div>
        </>
    );
};
