import { useInventoryFilterContext } from "../../../../context/InventoryFilter.tsx";
import { useShallow } from "zustand/react/shallow";
import styles from "../spell-filter.module.scss";
import Tippy from "@tippyjs/react";

export const E5ItemFilter = () => {
    const [filter, setFilter] = useInventoryFilterContext(useShallow((state) => [state.filter, state.setFilter]));
    return (
        <div style={{ display: "flex", gap: "10px", paddingBlock: "6px" }} className={styles.sticky}>
            <label>
                Sort:
                <select
                    value={filter.sort}
                    onChange={(e) => {
                        // @ts-ignore the options match the type
                        setFilter({ ...filter, sort: e.currentTarget.value });
                    }}
                >
                    <option>name</option>
                    <option>cost</option>
                    <option>equipped</option>
                    <option>attuned</option>
                </select>
            </label>
            <div className={`${styles.spellFilters} ${styles.left}`} style={{ alignItems: "center" }}>
                <Tippy content={"is equipped"}>
                    <button
                        className={`button ${styles.spellFilter} ${filter.filter.isEquipped ? styles.active : null}`}
                        onClick={() => {
                            setFilter({
                                ...filter,
                                filter: { ...filter.filter, isEquipped: !filter.filter.isEquipped },
                            });
                        }}
                    >
                        equ
                    </button>
                </Tippy>
                <Tippy content={"is attuned"}>
                    <button
                        className={`button ${styles.spellFilter} ${filter.filter.isAttuned ? styles.active : null}`}
                        onClick={() => {
                            setFilter({ ...filter, filter: { ...filter.filter, isAttuned: !filter.filter.isAttuned } });
                        }}
                    >
                        att
                    </button>
                </Tippy>
                <Tippy content={"can be consumed"}>
                    <button
                        className={`button ${styles.spellFilter} ${filter.filter.consumable ? styles.active : null}`}
                        onClick={() => {
                            setFilter({
                                ...filter,
                                filter: { ...filter.filter, consumable: !filter.filter.consumable },
                            });
                        }}
                    >
                        con
                    </button>
                </Tippy>
                <Tippy content={"search"}>
                    <input
                        style={{ width: "40px", height: "20px", flexGrow: 1 }}
                        type="text"
                        value={filter.filter.search}
                        onChange={(e) => {
                            setFilter({ ...filter, filter: { ...filter.filter, search: e.target.value } });
                        }}
                    />
                </Tippy>
            </div>
        </div>
    );
};
