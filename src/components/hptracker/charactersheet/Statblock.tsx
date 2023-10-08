import { useCharSheet } from "../../../context/CharacterContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../../helper/variables.ts";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { useEffect } from "react";
import { DnDCreatureOut, PFCreatureOut, useTtrpgApiGetCreature } from "../../../ttrpgapi/useTtrpgApi.ts";
import { Ability } from "./Ability.tsx";

const DndStatBlock = ({ slug }: { slug: string }) => {
    const creatureQuery = useTtrpgApiGetCreature(slug);

    const creature = creatureQuery.isSuccess && creatureQuery.data ? (creatureQuery.data as DnDCreatureOut) : null;

    const { characterId } = useCharSheet();

    const updateValues = (maxHp: number, ac: number) => {
        if (characterId) {
            OBR.scene.items.updateItems([characterId], (items) => {
                items.forEach((item) => {
                    const data = item.metadata[characterMetadata] as HpTrackerMetadata;
                    if (data.hp === 0 && data.maxHp === 0 && data.armorClass === 0) {
                        item.metadata[characterMetadata] = {
                            ...data,
                            maxHp: maxHp,
                            armorClass: ac,
                            hp: maxHp,
                        };
                    }
                });
            });
        }
    };

    useEffect(() => {
        if (creatureQuery.isSuccess && creature) {
            updateValues(creature.hp.value, creature.armor_class.value);
        }
    }, [creatureQuery.isSuccess]);

    return creature ? (
        <div className={"open5e-sheet"}>
            <div className={"what"}>
                <h3>{creature.name}</h3>
                <span>
                    {creature.size} {creature.type} {creature.alignment ? `, ${creature.alignment}` : null}
                </span>
            </div>
            <div className={"values"}>
                <span className={"ac"}>
                    <b>Armor Class</b> {creature.armor_class.value}{" "}
                    {creature.armor_class.special ? `(${creature.armor_class.special})` : null})
                </span>
                <span className={"hp"}>
                    <b>Hit Points</b> {creature.hp.value} {creature.hp.hit_dice ? `(${creature.hp.hit_dice})` : null})
                </span>
                <span className={"speed"}>
                    <b>Speed</b>{" "}
                    {Object.entries(creature.speed)
                        .map(([key, value]) => {
                            if (value) {
                                return `${key} ${value}`;
                            }
                            return null;
                        })
                        .filter((v) => !!v)
                        .join(", ")}
                </span>
            </div>
            <div className={"stats"}>
                {Object.entries(creature.stats).map(([stat, value]) => {
                    return (
                        <div className={"stat"} key={stat}>
                            <div className={"stat-name"}>{stat.substring(0, 3)}</div>
                            <div className={"stat-value"}>
                                {value} ({Math.floor((value - 10) / 2)})
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={"tidbits"}>
                {Object.entries(creature.saving_throws).filter((st) => !!st[1]).length > 0 ? (
                    <div className={"tidbit"}>
                        <b>Saving Throws</b>{" "}
                        {Object.entries(creature.saving_throws)
                            .map(([key, value]) => {
                                return `${key.substring(0, 3)} +${value}`;
                            })
                            .filter((v) => !!v)
                            .join(", ")}
                    </div>
                ) : null}
                <div className={"tidbit"}>
                    <b>Senses</b> {creature.senses?.join(", ")}
                </div>
                <div className={"tidbit"}>
                    <b>Languages</b> {creature.languages?.join(", ")}
                </div>
                <div className={"tidbit"}>
                    <b>Challenge</b> {creature.challenge_rating}
                </div>
            </div>
            <div className={"actions"}>
                <h3>Actions</h3>
                {creature.actions.map((action) => {
                    return (
                        <div key={action.name} className={"action"}>
                            <b>{action.name}.</b> {action.desc}
                        </div>
                    );
                })}
            </div>
            <div className={"special-abilities"}>
                <h3>Special Abilities</h3>
                {creature.special_abilities.map((ability) => {
                    return (
                        <div key={ability.name} className={"action"}>
                            <b>{ability.name}.</b> {ability.desc}
                        </div>
                    );
                })}
            </div>
        </div>
    ) : null;
};

const PfStatBlock = ({ slug }: { slug: string }) => {
    const { characterId } = useCharSheet();
    const creatureQuery = useTtrpgApiGetCreature(slug);

    const creature = creatureQuery.isSuccess && creatureQuery.data ? (creatureQuery.data as PFCreatureOut) : null;

    const updateValues = (maxHp: number, ac: number) => {
        if (characterId) {
            OBR.scene.items.updateItems([characterId], (items) => {
                items.forEach((item) => {
                    const data = item.metadata[characterMetadata] as HpTrackerMetadata;
                    if (data.hp === 0 && data.maxHp === 0 && data.armorClass === 0) {
                        item.metadata[characterMetadata] = {
                            ...data,
                            maxHp: maxHp,
                            armorClass: ac,
                            hp: maxHp,
                        };
                    }
                });
            });
        }
    };

    useEffect(() => {
        if (creatureQuery.isSuccess && creature) {
            updateValues(creature.hp.value, creature.armor_class.value);
        }
    }, [creatureQuery.isSuccess]);

    return creature ? (
        <div className={"pf-sheet"}>
            <div className={"what"}>
                <h3>{creature.name}</h3>
                <i>
                    Type: {creature.type}, Level: {creature.level}
                </i>
                <span>
                    {creature.senses && creature.senses.length > 0 ? (
                        <div className={"senses"}>
                            <b>Senses</b>: {creature.senses.join(", ")}
                        </div>
                    ) : null}
                </span>
                <span>
                    {creature.languages && creature.languages.length > 0 ? (
                        <div className={"languages"}>
                            <b>Languages</b>: {creature.languages.join(", ")}
                        </div>
                    ) : null}
                </span>
            </div>
            <div className={"values"}>
                <span className={"ac"}>
                    <b>Armor Class</b> {creature.armor_class.value}{" "}
                    {creature.armor_class.special ? `(${creature.armor_class.special})` : null})
                </span>
                <span className={"hp"}>
                    <b>Hit Points</b> {creature.hp.value} {creature.hp.special ? `(${creature.hp.special})` : null})
                </span>
                <span className={"speed"}>
                    <b>Speed</b> {creature.speed}
                </span>
                <span className={"perception"}>
                    <b>Perception</b> {creature.perception}
                </span>
            </div>
            <div className={"stats"}>
                {Object.entries(creature.stats).map(([stat, value]) => {
                    return (
                        <div className={"stat"} key={stat}>
                            <div className={"stat-name"}>{stat.substring(0, 3)}</div>
                            <div className={"stat-value"}>
                                {value * 2 + 10} ({value})
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={"saving-throws"}>
                {Object.entries(creature.saving_throws).filter((st) => !!st[1]).length > 0 ? (
                    <>
                        <b>Saving Throws</b>
                        <ul className={"saving-throw-list"}>
                            {Object.entries(creature.saving_throws).map(([key, value], index) => {
                                if (value) {
                                    return (
                                        <li key={index}>
                                            <span className={"name"}>{key}</span> +{value}
                                        </li>
                                    );
                                }
                            })}
                        </ul>
                    </>
                ) : null}
            </div>
            <div className={"skills"}>
                {creature.skills?.map((skill) => {
                    return (
                        <div className={"skill"} key={skill.name}>
                            <div className={"skill-name"}>{skill.name}</div>
                            <div className={"skill-value"}>{skill.value}</div>
                        </div>
                    );
                })}
            </div>
            {creature.items.length > 0 ? (
                <div className={"items"}>
                    <b>Items</b>: {creature.items.join(", ")}
                </div>
            ) : null}
            {creature.immunities.length > 0 ? (
                <div className={"immunities"}>
                    <b>Immunities</b>: {creature.immunities.join(", ")}
                </div>
            ) : null}
            {creature.weaknesses.length > 0 ? (
                <div className={"weaknesses"}>
                    <b>Weaknesses</b>: {creature.weaknesses.join(", ")}
                </div>
            ) : null}
            {creature.resistances.length > 0 ? (
                <div className={"resistances"}>
                    <b>Resistances</b>: {creature.resistances.join(", ")}
                </div>
            ) : null}

            <div className={"actions"}>
                <h3>Actions</h3>
                <ul className={"ability-list"}>
                    {creature.actions.map((action, index) => {
                        return <Ability key={index} ability={action} />;
                    })}
                </ul>
            </div>
            <div className={"reactions"}>
                <h3>Reactions</h3>
                <ul className={"ability-list"}>
                    {creature.reactions.map((reaction, index) => {
                        return <Ability key={index} ability={reaction} />;
                    })}
                </ul>
            </div>
            <div className={"special-abilities"}>
                <h3>Special Abilities</h3>
                <ul className={"ability-list"}>
                    {creature.special_abilities.map((ability, index) => {
                        return <Ability key={index} ability={ability} />;
                    })}
                </ul>
            </div>
            <div className={"spells"}>
                <h3>Spells</h3>
                {creature.spells.map((spells, index) => {
                    return (
                        <div key={index} className={"spell-list"}>
                            <span>
                                <b>{spells.name}</b>
                            </span>
                            <span>
                                <b>DC</b>: {spells.dc}
                            </span>
                            {spells.attack ? (
                                <span>
                                    <b> Attack</b>: {spells.attack}
                                </span>
                            ) : null}
                            <div className={"spell-name-list"}>
                                {spells.spell_lists
                                    .sort((a, b) => {
                                        if (a.type === "cantrip") {
                                            return -1;
                                        }
                                        if (b.type === "cantrip") {
                                            return 1;
                                        }
                                        if (parseInt(a.level) < parseInt(b.level)) {
                                            return -1;
                                        } else {
                                            return 1;
                                        }
                                    })
                                    .map((list, index) => {
                                        return (
                                            <div key={index} className={"spell-name"}>
                                                <span>
                                                    <b>Type</b>: {list.type}
                                                </span>
                                                <span>
                                                    <b>Level</b>: {list.level}
                                                </span>
                                                <span>
                                                    <b>Spells</b>: {list.spells.join(", ")}
                                                </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    ) : null;
};

export const Statblock = ({ slug }: { slug: string }) => {
    return <>{slug.startsWith("5e") ? <DndStatBlock slug={slug} /> : <PfStatBlock slug={slug} />}</>;
};
