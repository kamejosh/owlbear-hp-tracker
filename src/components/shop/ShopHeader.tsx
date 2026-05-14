import { useShopTokenContext } from "../../context/ShopTokenContext.tsx";
import { Image } from "@owlbear-rodeo/sdk";
import shopStyles from "./shop.module.scss";
import Tippy from "@tippyjs/react";
import { CloseSvg } from "../svgs/CloseSvg.tsx";
import { updateShopMetadata } from "../../helper/tokenHelper.ts";
import { getTokenName } from "../../helper/helpers.ts";

export const ShopHeader = ({ showStatus = false, showClose = true }: { showStatus?: boolean; showClose?: boolean }) => {
    const data = useShopTokenContext((state) => state.data);
    const token = useShopTokenContext((state) => state.token);
    const setToken = useShopTokenContext((state) => state.setToken);

    if (!token) return null;

    return (
        <div className={shopStyles.header}>
            {showClose && (
                <Tippy content={"Unselect Token"}>
                    <button className={shopStyles.unselectButton} onClick={() => setToken(null)}>
                        <CloseSvg />
                    </button>
                </Tippy>
            )}
            <div>
                {token.type === "IMAGE" ? (
                    <img src={(token as Image).image.url} alt={token.name} className={shopStyles.tokenImage} />
                ) : null}
            </div>
            <h2 className={shopStyles.tokenName}>Shop: {getTokenName(token)}</h2>
            {showStatus && data && (
                <Tippy content={data.shopAvailable ? "Shop is enabled for players" : "Shop is disabled for players"}>
                    <button
                        className={`button ${shopStyles.statusButton} ${
                            data.shopAvailable ? shopStyles.lootable : shopStyles.locked
                        }`}
                        onClick={() => {
                            void updateShopMetadata({ ...data, shopAvailable: !data.shopAvailable }, [token.id]);
                        }}
                    >
                        <span
                            className={`${shopStyles.statusDot} ${
                                data.shopAvailable ? shopStyles.lootable : shopStyles.locked
                            }`}
                        />
                        {data.shopAvailable ? "Open" : "Locked"}
                    </button>
                </Tippy>
            )}
        </div>
    );
};
