import styles from "./spell-filter.module.scss";

export const SpellFilter = (props: {
    filters: Array<string>;
    spellFilter: Array<number>;
    setSpellFilter: (filters: Array<number>) => void;
    left?: boolean;
}) => {
    return (
        <div className={`${styles.spellFilters} ${props.left ? styles.left : null}`}>
            {props.filters.map((filter) => {
                let active = false;
                if (filter === "All" && props.spellFilter.length === 0) {
                    active = true;
                } else if (filter === "Cant" && props.spellFilter.indexOf(0) >= 0) {
                    active = true;
                } else if (filter === "Const" && props.spellFilter.indexOf(-1) >= 0) {
                    active = true;
                } else {
                    active = props.spellFilter.indexOf(parseInt(filter)) >= 0;
                }

                return (
                    <button
                        className={`button ${styles.spellFilter} ${active ? styles.active : null}`}
                        key={filter}
                        onClick={() => {
                            if (filter === "All") {
                                props.setSpellFilter([]);
                            } else if (filter === "Cant") {
                                const currentFilter = Array.from(props.spellFilter);
                                if (currentFilter.indexOf(0) >= 0) {
                                    currentFilter.splice(currentFilter.indexOf(0), 1);
                                } else {
                                    currentFilter.push(0);
                                }
                                props.setSpellFilter(currentFilter);
                            } else if (filter === "Const") {
                                const currentFilter = Array.from(props.spellFilter);
                                if (currentFilter.indexOf(-1) >= 0) {
                                    currentFilter.splice(currentFilter.indexOf(-1), 1);
                                } else {
                                    currentFilter.push(-1);
                                }
                                props.setSpellFilter(currentFilter);
                            } else {
                                const buttonFilter = parseInt(filter);
                                const currentFilter = Array.from(props.spellFilter);
                                if (currentFilter.indexOf(buttonFilter) >= 0) {
                                    currentFilter.splice(currentFilter.indexOf(buttonFilter), 1);
                                } else {
                                    currentFilter.push(buttonFilter);
                                }
                                props.setSpellFilter(currentFilter);
                            }
                        }}
                    >
                        {filter}
                    </button>
                );
            })}
        </div>
    );
};
