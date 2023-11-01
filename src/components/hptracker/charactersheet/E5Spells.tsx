import { components } from "../../../ttrpgapi/schema";
import "./e5spell.scss";
import { useState } from "react";

type Spell = components["schemas"]["Spell"];

const Spell = (props: { spell: Spell }) => {
    const [open, setOpen] = useState<boolean>(false);

    const spell = props.spell;

    return (
        <li className={`spell`}>
            <div className={"info"}>
                <div className={"left"}>
                    <h4 className={"spell-name"}>{spell.name}</h4>
                    <span>
                        {spell.verbal || spell.somatic || spell.material ? <b>Components: </b> : null}
                        {spell.verbal ? "V" : null}
                        {spell.somatic ? "S" : null}
                        <span className={"spell-materials"}>
                            {spell.material ? `M` : null}
                            <span className={"material-details"}>
                                {!!spell.materials ? ` (${spell.materials})` : null}
                            </span>
                        </span>
                    </span>
                    <span>
                        <b>Level</b>: {spell.level}
                    </span>
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
                </div>
                <div className={"right"}>
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
                <button className={`expand ${open ? "open" : null}`} onClick={() => setOpen(!open)}></button>
            </div>
            <div className={`spell-more-info ${open ? "open" : null}`}>
                <div className={"more-info-content"}>
                    <div className={"spell-description"}>
                        <b>Description</b>: {spell.desc}
                    </div>
                    <div className={"spell-higher-level"}>
                        <b>Higher Levels</b>: {spell.higher_level}
                    </div>
                </div>
            </div>
        </li>
    );
};

export const E5Spells = (props: { spells: Array<Spell> }) => {
    return (
        <div className={"spells"}>
            <h3>Spells</h3>
            <ul className={"spell-list"}>
                {props.spells.map((spell, index) => {
                    return <Spell spell={spell} key={`${spell.name}${index}`} />;
                })}
            </ul>
        </div>
    );
};
