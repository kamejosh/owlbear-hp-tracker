import { useCharSheet } from "../../../context/CharacterContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../../helper/variables.ts";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import React, { useEffect } from "react";
import { DnDCreatureOut, PFCreatureOut, useTtrpgApiGetCreature } from "../../../ttrpgapi/useTtrpgApi.ts";

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
        <>
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
        </>
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
        <>
            <div className={"what"}>
                <h3>{creature.name}</h3>
                <span>{creature.type}</span>
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
            <div className={"tidbits"}>
                {Object.entries(creature.saving_throws).filter((st) => !!st[1]).length > 0 ? (
                    <div className={"tidbit"}>
                        <b>Saving Throws</b>{" "}
                        {Object.entries(creature.saving_throws)
                            .map(([key, value]) => {
                                return `${key.substring(0, 4)} +${value}`;
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
                    <b>Level</b> {creature.level}
                </div>
            </div>
            <div className={"actions"}>
                <h3>Actions</h3>
                {creature.actions.map((action) => {
                    return (
                        <div key={action.name} className={"action"}>
                            <b>{action.name}.</b> {action.description}
                        </div>
                    );
                })}
            </div>
            <div className={"special-abilities"}>
                <h3>Special Abilities</h3>
                {creature.special_abilities.map((ability) => {
                    return (
                        <div key={ability.name} className={"action"}>
                            <b>{ability.name}.</b> {ability.description}
                        </div>
                    );
                })}
            </div>
        </>
    ) : null;
};

export const Statblock = ({ slug }: { slug: string }) => {
    return (
        <div className={"open5e-sheet"}>
            {slug.startsWith("5e") ? <DndStatBlock slug={slug} /> : <PfStatBlock slug={slug} />}
        </div>
    );
};
