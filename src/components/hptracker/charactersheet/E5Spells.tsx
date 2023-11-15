import { components } from "../../../ttrpgapi/schema";
import "./e5spell.scss";
import { useState } from "react";
import { highlightDice } from "../../../helper/diceHelper.tsx";
import { getDamage } from "../../../helper/helpers.ts";

type Spell = components["schemas"]["Spell"];

const Spell = (props: { spell: Spell }) => {
    const [open, setOpen] = useState<boolean>(false);

    const spell = props.spell;

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

    const damage = getDamage(spell.desc);

    return (
        <li className={`spell`}>
            <div className={"spell-main"}>
                <div className={"spell-info"}>
                    <div className={"spell-header"}>
                        <h4 className={"spell-name"}>{spell.name}</h4>
                        <span className={"spell-level"}>({getSpellLevel()})</span>
                    </div>
                    {damage ? <span className={"spell-damage"}>Damage: {damage}</span> : null}
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
                        <b>Description</b>: {highlightDice(spell.desc)}
                    </div>
                    {!!spell.higher_level ? (
                        <div className={"spell-higher-level"}>
                            <b>Higher Levels</b>: {highlightDice(spell.higher_level)}
                        </div>
                    ) : null}
                </div>
            </div>
        </li>
    );
};

export const E5Spells = (props: { spells: Array<Spell> }) => {
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
            <h3>Spells</h3>
            <div className={"spell-filters"}>
                {filters.map((filter) => {
                    let active = false;
                    if (filter === "All" && spellFilter.length === 0) {
                        active = true;
                    } else if (filter === "Cant" && spellFilter.indexOf(0) >= 0) {
                        active = true;
                    } else {
                        active = spellFilter.indexOf(parseInt(filter)) >= 0;
                    }

                    return (
                        <button
                            className={`button spell-filter ${active ? "active" : null}`}
                            key={filter}
                            onClick={() => {
                                if (filter === "All") {
                                    setSpellFilter([]);
                                } else if (filter === "Cant") {
                                    const currentFilter = Array.from(spellFilter);
                                    if (currentFilter.indexOf(0) >= 0) {
                                        currentFilter.splice(currentFilter.indexOf(0), 1);
                                    } else {
                                        currentFilter.push(0);
                                    }
                                    setSpellFilter(currentFilter);
                                } else {
                                    const buttonFilter = parseInt(filter);
                                    const currentFilter = Array.from(spellFilter);
                                    if (currentFilter.indexOf(buttonFilter) >= 0) {
                                        currentFilter.splice(currentFilter.indexOf(buttonFilter), 1);
                                    } else {
                                        currentFilter.push(buttonFilter);
                                    }
                                    setSpellFilter(currentFilter);
                                }
                            }}
                        >
                            {filter}
                        </button>
                    );
                })}
            </div>
            <ul className={"spell-list"}>
                {props.spells
                    .sort((a, b) => a.level - b.level)
                    .filter((spell) => spellFilter.indexOf(spell.level) >= 0 || spellFilter.length === 0)
                    .map((spell, index) => {
                        return <Spell spell={spell} key={`${spell.name}${index}`} />;
                    })}
            </ul>
        </div>
    );
};
