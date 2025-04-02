import { components } from "../../../../api/schema";
import { useMemo, useState } from "react";
import { DiceButton, DiceButtonWrapper, Stats } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { getDamage, updateLimit } from "../../../../helper/helpers.ts";
import { SpellFilter } from "../SpellFilter.tsx";
import { capitalize, isUndefined } from "lodash";
import { E5SpellSlot } from "../../../../api/e5/useE5Api.ts";
import { GMGMetadata } from "../../../../helper/types.ts";
import { useMetadataContext } from "../../../../context/MetadataContext.ts";
import Tippy from "@tippyjs/react";
import { useShallow } from "zustand/react/shallow";
import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { FancyLineBreak, LineBreak } from "../../../general/LineBreak.tsx";
import styles from "./statblock-spells.module.scss";
import { SpellSlots } from "./E5SpellSlots.tsx";
import { LimitComponent, LimitType } from "../LimitComponent.tsx";
import { ItemCharges } from "./ItemCharges.tsx";
import { isItemInUse } from "../../../../helper/equipmentHelpers.ts";
import { addSpellToRollLog } from "../../../../helper/diceHelper.ts";
import { useRollLogContext } from "../../../../context/RollLogContext.tsx";

type Spell = components["schemas"]["src__types__e5__spell__Spell"];

const Spell = ({
    spell,
    statblock,
    stats,
    spellSlots,
    charges,
    chargesUsed,
    tokenData,
    itemId,
    dc,
    attack,
    embedded,
}: {
    spell: Spell;
    statblock: string;
    stats: Stats;
    spellSlots?: Array<E5SpellSlot> | null;
    charges?: LimitType | null;
    chargesUsed?: number;
    tokenData?: GMGMetadata;
    itemId?: string;
    dc?: string | null;
    attack?: string | null;
    embedded?: boolean;
}) => {
    const [open, setOpen] = useState<boolean>(false);
    const statblockContext = useE5StatblockContext();
    const room = useMetadataContext(useShallow((state) => state.room));
    const addRoll = useRollLogContext(useShallow((state) => state.addRoll));

    const getSpellLevel = () => {
        if (spell.level === 0) {
            return "Cantrip";
        } else if (spell.level === 1) {
            return "1st level";
        } else if (spell.level === 2) {
            return "2nd level";
        } else if (spell.level === 3) {
            return "3rd level";
        } else {
            return `${spell.level}th level`;
        }
    };

    const damage = spell.desc ? getDamage(spell.desc) : null;
    const spellLevelLimit = useMemo(() => {
        if (!isUndefined(charges)) {
            return charges;
        } else if (spellSlots) {
            return spellSlots?.find((s) => s.level === spell.level)?.limit;
        }
        return undefined;
    }, [spellSlots, spell, charges]);

    const limitValues = tokenData?.stats.limits?.find((l) => l.id === spellLevelLimit?.name);

    const limitReached = useMemo(() => {
        return spell.level === 0
            ? false
            : (limitValues && limitValues.max < limitValues.used + (chargesUsed || 1)) ||
                  (spellSlots && spellSlots.length > 0 && !spellLevelLimit);
    }, [spell, limitValues, spellSlots, spellLevelLimit]);

    return (
        <>
            <div className={styles.spellMain}>
                <div className={styles.spellInfo}>
                    <div className={styles.spellHeader}>
                        <h4 className={styles.spellName}>{spell.name}</h4>
                        <span className={styles.spellLevel}>({getSpellLevel()})</span>
                        {embedded && charges && limitValues && itemId ? (
                            <LimitComponent
                                limit={charges}
                                title={"none"}
                                limitValues={limitValues}
                                itemId={itemId}
                                hideDescription={true}
                                hideReset={true}
                            />
                        ) : null}
                        {chargesUsed ? <span className={styles.spellLevel}>(uses {chargesUsed} charges)</span> : null}
                        {(spellSlots && spellSlots.length > 0) || charges ? (
                            <Tippy content={"No more spellslots"} disabled={!limitReached}>
                                <div
                                    className={`button-wrapper enabled ${
                                        room?.disableDiceRoller ? "calculated" : "three-d-dice"
                                    }`}
                                >
                                    {spell.is_attack && attack ? (
                                        <>
                                            <DiceButton
                                                dice={`1d20+${attack}`}
                                                text={`+${attack}&nbspattack`}
                                                context={`${capitalize(spell.name)}: Attack`}
                                                statblock={statblock}
                                                stats={stats}
                                                onRoll={async () => {
                                                    if (itemId && limitValues) {
                                                        await updateLimit(itemId, limitValues, chargesUsed);
                                                    }
                                                }}
                                                limitReached={limitReached}
                                                proficiencyBonus={statblockContext.statblock.proficiency_bonus}
                                            />
                                        </>
                                    ) : (
                                        <button
                                            className={`dice-button button ${limitReached ? "limit" : ""}`}
                                            onClick={async () => {
                                                if (itemId && limitValues) {
                                                    await updateLimit(itemId, limitValues, chargesUsed);
                                                }
                                                await addSpellToRollLog(`${spell.name}: Cast`, addRoll, statblock);
                                            }}
                                        >
                                            cast
                                        </button>
                                    )}
                                </div>
                            </Tippy>
                        ) : null}
                    </div>
                    {spell.dc ? (
                        <span className={styles.spellDamage}>
                            DC: {spell.dc}
                            <DiceButton
                                dice={"1d20"}
                                text={`DC ${dc}`}
                                context={`${capitalize(spell.name)}: Attack`}
                                stats={stats}
                                proficiencyBonus={statblockContext.statblock.proficiency_bonus}
                            />
                        </span>
                    ) : null}
                    {damage ? (
                        <span className={styles.spellDamage}>
                            Damage:{" "}
                            <DiceButton
                                dice={damage}
                                text={damage}
                                context={`${capitalize(spell.name)}: Damage`}
                                stats={stats}
                                statblock={statblock}
                                limitReached={limitReached}
                                damageDie={true}
                                proficiencyBonus={statblockContext.statblock.proficiency_bonus}
                            />
                        </span>
                    ) : null}
                    <div className={styles.spellComponents}>
                        {spell.verbal ? "V" : null}
                        {spell.somatic ? "S" : null}
                        <span className={"spell-materials"}>
                            {spell.material ? `M` : null}
                            <span className={styles.materialDetails}>
                                {!!spell.materials ? ` (${spell.materials})` : null}
                            </span>
                        </span>
                    </div>
                </div>
                <button className={`expand ${open ? "open" : null}`} onClick={() => setOpen(!open)}></button>
            </div>
            <div className={`${styles.spellMoreInfo} ${open ? styles.open : null}`}>
                <div className={`${styles.moreInfoContent} ${open ? styles.micOpen : null}`}>
                    <div className={styles.infoBits}>
                        {!!spell.school.name ? (
                            <span>
                                <b>School</b>: {spell.school.name}
                            </span>
                        ) : null}
                        {spell.archetypes && spell.archetypes.length > 0 ? (
                            <span>
                                <b>Archetypes</b>: {spell.archetypes.map((archetype) => archetype.name).join(", ")}
                            </span>
                        ) : null}
                        {spell.circles && spell.circles.length > 0 ? (
                            <span>
                                <b>Circles</b>: {spell.circles.map((circle) => circle.name).join(", ")}
                            </span>
                        ) : null}
                        {spell.classes && spell.classes.length > 0 ? (
                            <span>
                                <b>Classes</b>: {spell.classes.map((c) => c.name).join(", ")}
                            </span>
                        ) : null}
                        <span>
                            <b>Casting Time</b>: {spell.casting_time}
                        </span>
                        <span>
                            <b>Range</b>: {spell.range}
                        </span>
                        <span>
                            <b>Can be Ritual</b>: {spell.ritual ? "Yes" : "No"}
                        </span>
                        <span>
                            <b>Duration</b>: {spell.duration}
                        </span>
                        <span>
                            <b>Concentration</b>: {spell.concentration ? "Yes" : "No"}
                        </span>
                    </div>
                    <div>
                        <b>Description</b>:
                        <DiceButtonWrapper
                            text={spell.desc || ""}
                            context={`${capitalize(spell.name)}`}
                            stats={stats}
                            statblock={statblock}
                            onRoll={async () => {
                                if (itemId && limitValues) {
                                    await updateLimit(itemId, limitValues);
                                }
                            }}
                            limitReached={limitReached}
                            proficiencyBonus={statblockContext.statblock.proficiency_bonus}
                        />
                    </div>
                    {!!spell.higher_level ? (
                        <div>
                            <b>Higher Levels</b>:{" "}
                            <DiceButtonWrapper
                                text={spell.higher_level}
                                stats={stats}
                                context={`${capitalize(spell.name)}: Higher Level`}
                                statblock={statblock}
                                proficiencyBonus={statblockContext.statblock.proficiency_bonus}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </>
    );
};

export const E5Spells = () => {
    const [spellFilter, setSpellFilter] = useState<Array<number>>([]);
    const { stats, data, item, tokenName, statblock, equipmentBonuses } = useE5StatblockContext();

    const spells = statblock.spells || [];
    const equipmentSpells: Array<{ item: number; spells: Array<{ spell: Spell; charges: number }> }> =
        equipmentBonuses.statblockBonuses.spells.flatMap((itemSpell) => {
            return {
                item: itemSpell.itemId,
                spells: itemSpell.spells.map((spell) => {
                    return { spell: spell.spell, charges: spell.charges };
                }),
            };
        });

    const filters = ["All"]
        .concat(
            spells.map((spell) => {
                if (spell.level === 0) {
                    return "Cant";
                } else if (spell.level === 1) {
                    return "1st";
                } else if (spell.level === 2) {
                    return "2nd";
                } else if (spell.level === 3) {
                    return "3rd";
                } else {
                    return `${spell.level}th`;
                }
            }),
        )
        .concat(
            equipmentSpells.flatMap((eSpells) => {
                return eSpells.spells.map((spell) => {
                    if (spell.spell.level === 0) {
                        return "Cant";
                    } else if (spell.spell.level === 1) {
                        return "1st";
                    } else if (spell.spell.level === 2) {
                        return "2nd";
                    } else if (spell.spell.level === 3) {
                        return "3rd";
                    } else {
                        return `${spell.spell.level}th`;
                    }
                });
            }),
        )
        .filter((value, index, self) => {
            return self.indexOf(value) === index;
        })
        .sort((a, b) => {
            if (a === "All") {
                return -1;
            } else if (b === "All") {
                return 1;
            } else if (a === "Cant") {
                return -1;
            } else if (b === "Cant") {
                return 1;
            } else {
                return parseInt(a) - parseInt(b);
            }
        });

    return (
        <div className={"spells"}>
            <div className={styles.top}>
                <h3 className={styles.heading}>Spells</h3>
            </div>
            <FancyLineBreak />
            <div className={styles.sticky}>
                <SpellFilter filters={filters} spellFilter={spellFilter} setSpellFilter={setSpellFilter} />
                <div className={styles.info}>
                    {statblock.spell_dc ? <span>DC {statblock.spell_dc}</span> : null}
                    {statblock.spell_attack ? (
                        <span className={styles.spellAttack}>
                            Attack{" "}
                            <DiceButton
                                dice={`d20+${statblock.spell_attack}`}
                                text={`+${statblock.spell_attack}`}
                                context={"Spell Attack"}
                                stats={stats}
                                proficiencyBonus={statblock.proficiency_bonus}
                            />
                        </span>
                    ) : null}
                </div>
                <SpellSlots />
            </div>

            <ul className={styles.spellList}>
                <li>
                    <LineBreak />
                </li>
                {spells
                    .sort((a, b) => a.level - b.level)
                    .filter((spell) => spellFilter.indexOf(spell.level) >= 0 || spellFilter.length === 0)
                    .map((spell, index) => {
                        return (
                            <li key={`${spell.name}${index}`}>
                                <Spell
                                    spell={spell}
                                    statblock={tokenName}
                                    stats={stats}
                                    spellSlots={statblock.spell_slots}
                                    tokenData={data}
                                    itemId={item.id}
                                    dc={statblock.spell_dc}
                                    attack={statblock.spell_attack}
                                />
                                <LineBreak />
                            </li>
                        );
                    })}
                {statblock.equipment
                    ?.filter((e) => e.embedded && isItemInUse(data, e))
                    ?.map((e) => {
                        return equipmentSpells
                            .filter((itemSpells) => itemSpells.item === e.item.id)
                            .map((itemSpells) => {
                                return itemSpells.spells
                                    .filter(
                                        (spell) =>
                                            spellFilter.indexOf(spell.spell.level) >= 0 || spellFilter.length === 0,
                                    )
                                    .sort((a, b) => a.spell.level - b.spell.level)
                                    .map((spell, index) => {
                                        return (
                                            <li key={`${spell.spell.name}${index}`}>
                                                <Spell
                                                    spell={spell.spell}
                                                    statblock={tokenName}
                                                    stats={stats}
                                                    spellSlots={statblock.spell_slots}
                                                    charges={e.item.charges}
                                                    chargesUsed={spell.charges}
                                                    tokenData={data}
                                                    itemId={item.id}
                                                    dc={statblock.spell_dc}
                                                    attack={statblock.spell_attack}
                                                    embedded={true}
                                                />
                                                <LineBreak />
                                            </li>
                                        );
                                    });
                            });
                    })}
                {statblock.equipment
                    ?.filter((e) => !e.embedded && isItemInUse(data, e))
                    ?.map((e) => {
                        return equipmentSpells
                            .filter((itemSpells) => itemSpells.item === e.item.id)
                            .map((itemSpells, index) => {
                                if (!itemSpells.spells.length) return null;
                                return (
                                    <li key={index}>
                                        <h4 className={styles.heading}>{e.item.name}</h4>
                                        <ItemCharges equippedItem={e.item} />
                                        <FancyLineBreak />
                                        {itemSpells.spells
                                            .filter(
                                                (spell) =>
                                                    spellFilter.indexOf(spell.spell.level) >= 0 ||
                                                    spellFilter.length === 0,
                                            )
                                            .sort((a, b) => a.spell.level - b.spell.level)
                                            .map((spell, index) => {
                                                return (
                                                    <div key={`${spell.spell.name}${index}`}>
                                                        <Spell
                                                            spell={spell.spell}
                                                            statblock={tokenName}
                                                            stats={stats}
                                                            tokenData={data}
                                                            charges={e.item.charges}
                                                            chargesUsed={spell.charges}
                                                            itemId={item.id}
                                                            dc={statblock.spell_dc}
                                                            attack={statblock.spell_attack}
                                                        />
                                                        <LineBreak />
                                                    </div>
                                                );
                                            })}
                                    </li>
                                );
                            });
                    })}
            </ul>
        </div>
    );
};
