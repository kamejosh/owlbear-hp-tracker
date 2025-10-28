import { AbilityShareEntry, useAbilityShareStore } from "../../context/AbilityShareStore.tsx";
import { useShallow } from "zustand/react/shallow";
import { E5Ability } from "../gmgrimoire/statblocks/e5/E5Ability.tsx";
import { Spell as E5Spell } from "../gmgrimoire/statblocks/e5/E5Spells.tsx";
import { Spell as PFSpell } from "../gmgrimoire/statblocks/pf/PfSpells.tsx";
import { PfAbility } from "../gmgrimoire/statblocks/pf/PfAbility.tsx";
import { E5StatblockContext, E5StatblockContextType } from "../../context/E5StatblockContext.tsx";
import { PropsWithChildren, useMemo, useState } from "react";
import { getTokenName } from "../../helper/helpers.ts";
import { useTokenListContext } from "../../context/TokenContext.tsx";
import { defaultStats } from "../../helper/variables.ts";
import { GMGMetadata } from "../../helper/types.ts";
import { getEquipmentBonuses } from "../../helper/equipmentHelpers.ts";
import styles from "./shared-ability.module.scss";
import { usePinnedAbilitiesStore } from "../../context/PinnedAbilitiesStore.tsx";
import { PFStatblockContext, PFStatblockContextType } from "../../context/PFStatblockContext.tsx";
import { useDebounce } from "ahooks";

const defaultData: GMGMetadata = {
    hp: 0,
    maxHp: 0,
    armorClass: 0,
    hpTrackerActive: true,
    hpOnMap: false,
    acOnMap: false,
    hpBar: false,
    initiative: 0,
    sheet: "",
    stats: {
        initiativeBonus: 0,
    },
};

const getShareTimeText = (delta: number) => {
    const msPerDay = 86400000;
    const msPerHour = 3600000;
    const msPerMinute = 60000;

    const days = Math.floor(delta / msPerDay);
    if (days > 0) {
        return `${days}d`;
    }
    const hours = Math.floor((delta % msPerDay) / msPerHour);
    if (hours > 0) {
        return `${hours}h`;
    }
    const minutes = Math.floor(((delta % msPerDay) % msPerHour) / msPerMinute);
    if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return "now";
    }
};

export const E5AbilityWrapper = (props: PropsWithChildren & { ability: AbilityShareEntry }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(props.ability.itemId)));

    const getContextData = (): E5StatblockContextType => {
        if (token) {
            const data = token.data;
            const item = token.item;
            const equipmentBonuses = getEquipmentBonuses(data, props.ability.statblockStats ?? defaultStats, []);
            return {
                tokenName: getTokenName(item),
                data: data,
                item: item,
                // @ts-ignore this is not used in this context
                statblock: {
                    proficiency_bonus: 0,
                    name: props.ability.statblockName,
                    stats: props.ability.statblockStats ?? defaultStats,
                },
                stats: props.ability.statblockStats ?? defaultStats,
                equipmentBonuses: equipmentBonuses,
            };
        } else {
            const equipmentBonuses = getEquipmentBonuses(defaultData, props.ability.statblockStats ?? defaultStats, []);
            return {
                tokenName: props.ability.statblockName,
                data: { ...defaultData, sheet: props.ability.statblockName },
                // @ts-ignore this is not used in this context
                item: { id: "0" },
                // @ts-ignore this is not used in this context
                statblock: {
                    proficiency_bonus: 0,
                    name: props.ability.statblockName,
                    stats: props.ability.statblockStats ?? defaultStats,
                },
                stats: props.ability.statblockStats ?? defaultStats,
                equipmentBonuses: equipmentBonuses,
            };
        }
    };

    return <E5StatblockContext.Provider value={getContextData()}>{props.children}</E5StatblockContext.Provider>;
};

export const PfAbilityWrapper = (props: PropsWithChildren & { ability: AbilityShareEntry }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(props.ability.itemId)));

    const getContextData = (): PFStatblockContextType => {
        if (token) {
            const data = token.data;
            const item = token.item;
            return {
                tokenName: getTokenName(item),
                data: data,
                item: item,
                // @ts-ignore this is not used in this context
                statblock: {
                    name: props.ability.statblockName,
                    stats: props.ability.statblockStats ?? defaultStats,
                },
                stats: props.ability.statblockStats ?? defaultStats,
            };
        } else {
            return {
                tokenName: props.ability.statblockName,
                data: { ...defaultData, sheet: props.ability.statblockName },
                // @ts-ignore this is not used in this context
                item: { id: "0" },
                // @ts-ignore this is not used in this context
                statblock: {
                    name: props.ability.statblockName,
                    stats: props.ability.statblockStats ?? defaultStats,
                },
                stats: props.ability.statblockStats ?? defaultStats,
            };
        }
    };

    return <PFStatblockContext.Provider value={getContextData()}>{props.children}</PFStatblockContext.Provider>;
};

export const SharedAbilities = () => {
    const [abilities, removeAbility, lastReadCount, setLastReadCount] = useAbilityShareStore(
        useShallow((state) => [state.abilities, state.removeAbility, state.lastReadCount, state.setLastReadCount]),
    );
    const [pinnedAbilities, pinAbility, unpinAbility] = usePinnedAbilitiesStore(
        useShallow((state) => [state.pinnedAbilities, state.pinAbility, state.unPinAbility]),
    );
    const [filter, setFilter] = useState<string>("");
    const debounceFilter = useDebounce(filter, { wait: 500 });

    const sortedAbilities = useMemo(() => {
        return abilities
            .filter((a) => {
                return (
                    a.name.toLowerCase().includes(debounceFilter.toLowerCase()) ||
                    a.statblockName.toLowerCase().includes(debounceFilter.toLowerCase())
                );
            })
            .sort((a: AbilityShareEntry, b: AbilityShareEntry) => {
                const aPinnedIndex = pinnedAbilities.indexOf(a.id);
                const bPinnedIndex = pinnedAbilities.indexOf(b.id);
                if (aPinnedIndex >= 0 && bPinnedIndex >= 0) {
                    return bPinnedIndex - aPinnedIndex;
                } else if (aPinnedIndex >= 0 && bPinnedIndex === -1) {
                    return -1;
                } else if (aPinnedIndex === -1 && bPinnedIndex >= 0) {
                    return 1;
                } else {
                    const aTime = new Date(a.timestamp ?? "0").getTime();
                    const bTime = new Date(b.timestamp ?? "0").getTime();
                    return bTime - aTime;
                }
            });
    }, [abilities, pinnedAbilities, debounceFilter]);
    const renderAbility = (ability: AbilityShareEntry) => {
        if (ability.e5Action) {
            return (
                <E5AbilityWrapper ability={ability}>
                    <E5Ability ability={ability.e5Action} hideShare={true} />
                </E5AbilityWrapper>
            );
        }
        if (ability.e5Spell) {
            return (
                <E5AbilityWrapper ability={ability}>
                    <E5Spell
                        spell={ability.e5Spell}
                        statblock={ability.statblockName}
                        stats={ability.statblockStats ?? defaultStats}
                        hideShare={true}
                        attack={ability.spellAttack}
                        dc={ability.spellDc}
                    />
                </E5AbilityWrapper>
            );
        }
        if (ability.pfAction) {
            return (
                <PfAbilityWrapper ability={ability}>
                    <PfAbility
                        ability={ability.pfAction}
                        statblock={ability.statblockName}
                        stats={ability.statblockStats ?? defaultStats}
                        hideShare={true}
                    />
                </PfAbilityWrapper>
            );
        }
        if (ability.pfSpell) {
            return (
                <PfAbilityWrapper ability={ability}>
                    <PFSpell
                        spell={ability.pfSpell}
                        statblock={ability.statblockName}
                        stats={ability.statblockStats ?? defaultStats}
                        hideShare={true}
                    />
                </PfAbilityWrapper>
            );
        }
        return null;
    };

    return (
        <div
            className={styles.abilitiesWrapper}
            onScroll={() => {
                if (lastReadCount != abilities.length) {
                    setLastReadCount(abilities.length);
                }
            }}
        >
            <div className={styles.filterWrapper}>
                <input
                    type={"text"}
                    placeholder={"filter abilities"}
                    value={filter}
                    onChange={(e) => {
                        setFilter(e.target.value);
                    }}
                />
            </div>
            {sortedAbilities.map((ability, index) => {
                const pinned = pinnedAbilities.includes(ability.id);
                const deltaTime = new Date().getTime() - new Date(ability.timestamp ?? "0").getTime();
                return (
                    <div className={`${styles.sharedAbilityWrapper} ${pinned ? styles.pinnedWrapper : ""}`} key={index}>
                        <div className={styles.topContent}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                                <span className={styles.statblockName}>{ability.statblockName}</span>
                                <span className={styles.sharedBy}>{ability.username}</span>{" "}
                                <span className={styles.timestamp}>{getShareTimeText(deltaTime)}</span>
                            </div>
                            <div className={styles.abilityButtons}>
                                <button
                                    className={`${pinned ? styles.pinned : ""}`}
                                    onClick={() => {
                                        if (pinned) {
                                            unpinAbility(ability.id);
                                        } else {
                                            pinAbility(ability.id);
                                        }
                                    }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        height="24"
                                        viewBox="0 -960 960 960"
                                        width="24"
                                    >
                                        <path
                                            d="m640-480 80 80v80H520v240l-40 40-40-40v-240H240v-80l80-80v-280h-40v-80h400v80h-40v280Zm-286 80h252l-46-46v-314H400v314l-46 46Zm126 0Z"
                                            fill="currentColor"
                                        />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => {
                                        if (ability.id) {
                                            unpinAbility(ability.id);
                                            removeAbility(ability.id);
                                        }
                                    }}
                                >
                                    X
                                </button>
                            </div>
                        </div>
                        {renderAbility(ability)}
                    </div>
                );
            })}
        </div>
    );
};
