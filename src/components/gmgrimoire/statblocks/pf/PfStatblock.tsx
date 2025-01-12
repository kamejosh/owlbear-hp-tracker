import { useMetadataContext } from "../../../../context/MetadataContext.ts";
import { usePfGetStatblock } from "../../../../api/pf/usePfApi.ts";
import { DiceButton } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize } from "lodash";
import { About } from "../About.tsx";
import { PfAbility } from "./PfAbility.tsx";
import { PfSpells } from "./PfSpells.tsx";
import { HP } from "../../Token/HP.tsx";
import { AC } from "../../Token/AC.tsx";
import { Initiative } from "../../Token/Initiative.tsx";
import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";

export const PfStatBlock = ({
    slug,
    name,
    itemId,
    setScrollTargets,
}: {
    slug: string;
    name: string;
    itemId: string;
    setScrollTargets?: (scrollTargets: Array<{ name: string; target: string }>) => void;
}) => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const statblockQuery = usePfGetStatblock(slug, room?.tabletopAlmanacAPIKey);

    const statblock = statblockQuery.isSuccess && statblockQuery.data ? statblockQuery.data : null;

    useEffect(() => {
        if (statblock && setScrollTargets) {
            const scrollTargets = new Array({ name: "top", target: "StatblockTop" });
            if (Object.entries(statblock.saving_throws).filter((st) => !!st[1]).length > 0) {
                scrollTargets.push({ name: "saves", target: "StatblockSavingThrows" });
            }
            if (statblock.skills && Object.entries(statblock.skills).filter(([_, value]) => !!value).length > 0) {
                scrollTargets.push({ name: "skills", target: "StatblockSkills" });
            }
            if (statblock.actions) {
                scrollTargets.push({ name: "actions", target: "StatblockActions" });
            }
            if (statblock.spells && statblock.spells.length > 0) {
                scrollTargets.push({ name: "spells", target: "StatblockSpells" });
            }
            setScrollTargets(scrollTargets);
        }
    }, [statblock]);

    return statblock ? (
        <div className={"pf-sheet"}>
            <div className={"what"} id={"StatblockTop"}>
                <h3>{statblock.name}</h3>
                <i>
                    Type: {statblock.type}, Level: {statblock.level}
                </i>
                <span>
                    {statblock.senses && statblock.senses.length > 0 ? (
                        <div className={"senses"}>
                            <b>Senses</b>: {statblock.senses.join(", ")}
                        </div>
                    ) : null}
                </span>
                <span>
                    {statblock.languages && statblock.languages.length > 0 ? (
                        <div className={"languages"}>
                            <b>Languages</b>: {statblock.languages.join(", ")}
                        </div>
                    ) : null}
                </span>
                <span className={"speed"}>
                    <b>Speed</b> {statblock.speed}
                </span>
            </div>
            <div className={"values"}>
                <span className={"init"}>
                    <b>Initiative</b>
                    <Initiative id={itemId} />
                </span>
                <span className={"hp"}>
                    <b>Hit Points</b> <HP id={itemId} /> {statblock.hp.special ? `(${statblock.hp.special})` : null}
                </span>
                <span className={"ac"}>
                    <b>Armor Class</b> <AC id={itemId} />
                    {statblock.armor_class.special ? `(${statblock.armor_class.special})` : null}
                </span>
            </div>
            <div className={"stats"}>
                {Object.entries(statblock.stats).map(([stat, value]) => {
                    return (
                        <div className={"stat"} key={stat}>
                            <div className={"stat-name"}>{stat.substring(0, 3)}</div>
                            <div className={"stat-value"}>
                                <DiceButton
                                    dice={`d20${Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                        Math.floor(value),
                                    )}`}
                                    text={Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                        Math.floor(value),
                                    )}
                                    stats={statblock.stats}
                                    context={`${capitalize(stat)}: Check`}
                                    statblock={name}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={"saving-throws"} id={"StatblockSavingThrows"}>
                {Object.entries(statblock.saving_throws).filter((st) => !!st[1]).length > 0 ? (
                    <>
                        <b>Saving Throws</b>
                        <ul className={"saving-throw-list"}>
                            {Object.entries(statblock.saving_throws).map(([key, value], index) => {
                                if (value) {
                                    if (typeof value === "number") {
                                        return (
                                            <li key={index}>
                                                <span className={"name"}>{key}</span>{" "}
                                                <DiceButton
                                                    dice={`d20+${value}`}
                                                    text={`+${value}`}
                                                    stats={statblock.stats}
                                                    context={`${capitalize(key)}: Save`}
                                                    statblock={name}
                                                />
                                            </li>
                                        );
                                    } else {
                                        return <li key={index}>{value}</li>;
                                    }
                                }
                            })}
                        </ul>
                    </>
                ) : null}
            </div>
            {statblock.traits && statblock.traits.length > 0 ? (
                <div className={"skills"}>
                    <h3>Traits</h3>
                    <div className={"skill-list"}>
                        {statblock.traits?.map((trait) => {
                            let value = trait.value;
                            if (trait.value.includes(",")) {
                                value = trait.value.split(",")[0];
                            }
                            return (
                                <div className={"skill"} key={trait.name}>
                                    <div className={"skill-name"}>{trait.name}</div>
                                    <div className={"skill-value"}>{value}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}
            {statblock.skills && statblock.skills.length > 0 ? (
                <div className={"skills"} id={"StatblockSkills"}>
                    <h3>Skills</h3>
                    <div className={"skill-list"}>
                        {statblock.skills?.map((skill) => {
                            let value = skill.value;
                            if (skill.value.includes(",")) {
                                value = skill.value.split(",")[0];
                            }
                            return (
                                <div className={"skill"} key={skill.name}>
                                    <div className={"skill-name"}>{skill.name}</div>
                                    <div className={"skill-value"}>
                                        <DiceButton
                                            dice={`d20${value}`}
                                            text={value}
                                            stats={statblock.stats}
                                            context={`${capitalize(skill.name)}: Check`}
                                            statblock={name}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}
            <About about={statblock.about} slug={slug} statblock={statblock} />
            {statblock.items?.length && statblock.items.length > 0 ? (
                <div className={"items"}>
                    <b>Items</b>: {statblock.items.join(", ")}
                </div>
            ) : null}
            {statblock.immunities?.length && statblock.immunities.length > 0 ? (
                <div className={"immunities"}>
                    <b>Immunities</b>: {statblock.immunities.join(", ")}
                </div>
            ) : null}
            {statblock.weaknesses?.length && statblock.weaknesses.length > 0 ? (
                <div className={"weaknesses"}>
                    <b>Weaknesses</b>: {statblock.weaknesses.join(", ")}
                </div>
            ) : null}
            {statblock.resistances?.length && statblock.resistances.length > 0 ? (
                <div className={"resistances"}>
                    <b>Resistances</b>: {statblock.resistances.join(", ")}
                </div>
            ) : null}

            <div className={"actions"} id={"StatblockActions"}>
                <h3>Actions</h3>
                <ul className={"ability-list"}>
                    {statblock.actions.map((action, index) => {
                        return <PfAbility key={index} ability={action} statblock={name} stats={statblock.stats} />;
                    })}
                </ul>
            </div>
            {statblock.reactions && statblock.reactions.length > 0 ? (
                <div className={"reactions"}>
                    <h3>Reactions</h3>
                    <ul className={"ability-list"}>
                        {statblock.reactions?.map((reaction, index) => {
                            return (
                                <PfAbility key={index} ability={reaction} statblock={name} stats={statblock.stats} />
                            );
                        })}
                    </ul>
                </div>
            ) : null}
            {statblock.special_abilities && statblock.special_abilities.length > 0 ? (
                <div className={"special-abilities"}>
                    <h3>Special Abilities</h3>
                    <ul className={"ability-list"}>
                        {statblock.special_abilities?.map((ability, index) => {
                            return <PfAbility key={index} ability={ability} statblock={name} stats={statblock.stats} />;
                        })}
                    </ul>
                </div>
            ) : null}
            {statblock.spells && statblock.spells.length > 0 ? (
                <PfSpells spells={statblock.spells} statblock={name} stats={statblock.stats} />
            ) : null}
        </div>
    ) : null;
};
