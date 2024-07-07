import { components } from "../../../api/schema";
import { useState } from "react";
import { DiceButton, DiceButtonWrapper } from "../../general/DiceRoller/DiceButtonWrapper.tsx";
import { getDamage, updateLimit } from "../../../helper/helpers.ts";
import { SpellFilter } from "./SpellFilter.tsx";
import { capitalize } from "lodash";
import { E5SpellSlot } from "../../../api/e5/useE5Api.ts";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import tippy, { Instance } from "tippy.js";

type Spell = components["schemas"]["src__types__e5__Spell"];

const Spell = ({
    spell,
    statblock,
    spellSlots,
    tokenData,
    itemId,
    dc,
    attack,
}: {
    spell: Spell;
    statblock: string;
    spellSlots?: Array<E5SpellSlot> | null;
    tokenData?: HpTrackerMetadata;
    itemId?: string;
    dc?: string | null;
    attack?: string | null;
}) => {
    const [open, setOpen] = useState<boolean>(false);
    const [tooltip, setTooltip] = useState<Instance>();
    const room = useMetadataContext((state) => state.room);

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
    const spellLevelLimit = spellSlots?.find((s) => s.level === spell.level)?.limit;

    const limitValues = tokenData?.stats.limits?.find((l) => l.id === spellLevelLimit?.name);
    const limitReached =
        spell.level === 0
            ? false
            : (limitValues && limitValues.max === limitValues.used) ||
              (spellSlots && spellSlots.length > 0 && !spellLevelLimit);

    return (
        <li className={`spell`}>
            <div className={"spell-main"}>
                <div className={"spell-info"}>
                    <div className={"spell-header"}>
                        <h4 className={"spell-name"}>{spell.name}</h4>
                        <span className={"spell-level"}>({getSpellLevel()})</span>
                        {spellSlots && spellSlots.length > 0 ? (
                            <div
                                ref={(e) => {
                                    if (e) {
                                        if (tooltip) {
                                            if (limitReached) {
                                                tooltip.enable();
                                                tooltip.setContent("No more spellslots");
                                            } else {
                                                tooltip.disable();
                                            }
                                        } else {
                                            if (limitReached) {
                                                setTooltip(tippy(e, { content: "No more spellslots" }));
                                            }
                                        }
                                    }
                                }}
                                className={`button-wrapper enabled ${
                                    room?.disableDiceRoller ? "calculated" : "three-d-dice"
                                }`}
                            >
                                {spell.is_attack && attack ? (
                                    <>
                                        <DiceButton
                                            dice={`1d20+${attack}`}
                                            text={`+${attack}(attack)`}
                                            context={`${capitalize(spell.name)}: Attack`}
                                            statblock={statblock}
                                            onRoll={async () => {
                                                if (itemId && limitValues) {
                                                    await updateLimit(itemId, limitValues);
                                                }
                                            }}
                                            limitReached={limitReached}
                                        />
                                    </>
                                ) : (
                                    <button
                                        className={`dice-button button ${limitReached ? "limit" : ""}`}
                                        onClick={async () => {
                                            if (itemId && limitValues) {
                                                await updateLimit(itemId, limitValues);
                                            }
                                        }}
                                    >
                                        <div className={"dice-preview"}></div>
                                        cast
                                        <div className={"dice-preview"}></div>
                                    </button>
                                )}
                            </div>
                        ) : null}
                    </div>
                    {spell.dc ? (
                        <span className={"spell-damage"}>
                            DC: {spell.dc}
                            <DiceButton dice={"1d20"} text={`DC ${dc}`} context={`${capitalize(spell.name)}: Attack`} />
                        </span>
                    ) : null}
                    {damage ? (
                        <span className={"spell-damage"}>
                            Damage:{" "}
                            <DiceButton
                                dice={damage}
                                text={damage}
                                context={`${capitalize(spell.name)}: Damage`}
                                statblock={statblock}
                                onRoll={async () => {
                                    if (itemId && limitValues && !spell.is_attack) {
                                        await updateLimit(itemId, limitValues);
                                    }
                                }}
                                limitReached={limitReached}
                            />
                        </span>
                    ) : null}
                    <div className={"spell-components"}>
                        {spell.verbal ? "V" : null}
                        {spell.somatic ? "S" : null}
                        <span className={"spell-materials"}>
                            {spell.material ? `M` : null}
                            <span className={"material-details"}>
                                {!!spell.materials ? ` (${spell.materials})` : null}
                            </span>
                        </span>
                    </div>
                </div>
                <button className={`expand ${open ? "open" : null}`} onClick={() => setOpen(!open)}></button>
            </div>
            <div className={`spell-more-info ${open ? "open" : null}`}>
                <div className={"more-info-content"}>
                    <div className={"info-bits"}>
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
                    <div className={"spell-description"}>
                        <b>Description</b>:{" "}
                        <DiceButtonWrapper
                            text={spell.desc || ""}
                            context={`${capitalize(spell.name)}`}
                            statblock={statblock}
                            onRoll={async () => {
                                if (itemId && limitValues) {
                                    await updateLimit(itemId, limitValues);
                                }
                            }}
                            limitReached={limitReached}
                        />
                    </div>
                    {!!spell.higher_level ? (
                        <div className={"spell-higher-level"}>
                            <b>Higher Levels</b>:{" "}
                            <DiceButtonWrapper
                                text={spell.higher_level}
                                context={`${capitalize(spell.name)}: Higher Level`}
                                statblock={statblock}
                            />
                        </div>
                    ) : null}
                </div>
            </div>
        </li>
    );
};

export const E5Spells = (props: {
    spells: Array<Spell>;
    statblock: string;
    spellSlots?: Array<E5SpellSlot> | null;
    tokenData?: HpTrackerMetadata;
    itemId?: string;
    dc?: string | null;
    attack?: string | null;
}) => {
    const [spellFilter, setSpellFilter] = useState<Array<number>>([]);

    const filters = ["All"]
        .concat(
            props.spells.map((spell) => {
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
            })
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
            <div className={"top"}>
                <h3>Spells</h3>
                {props.dc ? <span>DC {props.dc}</span> : null}
                {props.attack ? <span>Attack +{props.attack}</span> : null}
            </div>
            <SpellFilter filters={filters} spellFilter={spellFilter} setSpellFilter={setSpellFilter} />
            <ul className={"spell-list"}>
                {props.spells
                    .sort((a, b) => a.level - b.level)
                    .filter((spell) => spellFilter.indexOf(spell.level) >= 0 || spellFilter.length === 0)
                    .map((spell, index) => {
                        return (
                            <Spell
                                spell={spell}
                                key={`${spell.name}${index}`}
                                statblock={props.statblock}
                                spellSlots={props.spellSlots}
                                tokenData={props.tokenData}
                                itemId={props.itemId}
                                dc={props.dc}
                                attack={props.attack}
                            />
                        );
                    })}
            </ul>
        </div>
    );
};
