import { useCharSheet } from "../../../context/CharacterContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import { characterMetadata, ID } from "../../../helper/variables.ts";
import { HpTrackerMetadata, Ruleset } from "../../../helper/types.ts";
import { useEffect } from "react";
import { PfAbility } from "./PfAbility.tsx";
import { useE5GetStatblock } from "../../../ttrpgapi/e5/useE5Api.ts";
import { usePfGetStatblock } from "../../../ttrpgapi/pf/usePfApi.ts";
import { useLocalStorage } from "../../../helper/hooks.ts";
import { E5Ability } from "./E5Ability.tsx";
import { E5Spells } from "./E5Spells.tsx";

const E5StatBlock = ({ slug }: { slug: string }) => {
    const statblockQuery = useE5GetStatblock(slug);

    const statblock = statblockQuery.isSuccess && statblockQuery.data ? statblockQuery.data : null;

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
        if (statblockQuery.isSuccess && statblock) {
            updateValues(statblock.hp.value, statblock.armor_class.value);
        }
    }, [statblockQuery.isSuccess]);

    return statblock ? (
        <div className={"open5e-sheet"}>
            <div className={"what"}>
                <h3>{statblock.name}</h3>
                <span>
                    {statblock.size} {statblock.type} {statblock.subtype ? `, ${statblock.subtype}` : null}
                    {statblock.alignment ? `, ${statblock.alignment}` : null}
                    {statblock.group ? `, ${statblock.group}` : null}
                </span>
            </div>
            <div className={"values"}>
                <span className={"ac"}>
                    <b>Armor Class</b> {statblock.armor_class.value}{" "}
                    {!!statblock.armor_class.special ? `(${statblock.armor_class.special})` : null}
                </span>
                <span className={"hp"}>
                    <b>Hit Points</b> {statblock.hp.value} {statblock.hp.hit_dice ? `(${statblock.hp.hit_dice})` : null}
                </span>
                <span className={"speed"}>
                    <b>Speed</b>{" "}
                    {Object.entries(statblock.speed)
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
                {Object.entries(statblock.stats).map(([stat, value]) => {
                    return (
                        <div className={"stat"} key={stat}>
                            <div className={"stat-name"}>{stat.substring(0, 3)}</div>
                            <div className={"stat-value"}>
                                {value} (
                                {Intl.NumberFormat("en-US", { signDisplay: "exceptZero" }).format(
                                    Math.floor((value - 10) / 2)
                                )}
                                )
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={"tidbits"}>
                {Object.entries(statblock.saving_throws).filter((st) => !!st[1]).length > 0 ? (
                    <div className={"tidbit"}>
                        <b>Saving Throws</b>{" "}
                        {Object.entries(statblock.saving_throws)
                            .map(([key, value]) => {
                                if (value) {
                                    return `${key.substring(0, 3)} +${value}`;
                                }
                            })
                            .filter((v) => !!v)
                            .join(", ")}
                    </div>
                ) : null}
                <div className={"tidbit"}>
                    <b>Senses</b> {statblock.senses?.join(", ")}
                </div>
                <div className={"tidbit"}>
                    <b>Languages</b> {statblock.languages?.join(", ")}
                </div>
                <div className={"tidbit"}>
                    <b>Challenge</b> {statblock.challenge_rating}
                </div>
            </div>
            {statblock.skills ? (
                <div className={"skills"}>
                    <h3>Skills</h3>
                    <ul className={"skill-list"}>
                        {Object.entries(statblock.skills).map(([key, value], index) => {
                            if (value) {
                                return (
                                    <li key={index}>
                                        <b>{key}</b>:{" "}
                                        {Intl.NumberFormat("en-US", { signDisplay: "exceptZero" }).format(value)}
                                    </li>
                                );
                            }
                        })}
                    </ul>
                </div>
            ) : null}
            {statblock.damage_vulnerabilities ||
            statblock.damage_resistances ||
            statblock.damage_immunities ||
            statblock.condition_immunities ? (
                <div className={"resistances"}>
                    {statblock.damage_vulnerabilities ? (
                        <>
                            <h3>Damage Vulnerabilities</h3> {statblock.damage_vulnerabilities}
                        </>
                    ) : null}
                    {statblock.damage_resistances ? (
                        <>
                            <h3>Damage Resistances</h3> {statblock.damage_resistances}
                        </>
                    ) : null}
                    {statblock.damage_immunities ? (
                        <>
                            <h3>Damage Immunities</h3> {statblock.damage_immunities}
                        </>
                    ) : null}
                    {statblock.condition_immunities ? (
                        <>
                            <h3>Condition Immunities</h3> {statblock.condition_immunities}
                        </>
                    ) : null}
                </div>
            ) : null}
            {statblock.actions && statblock.actions.length > 0 ? (
                <div className={"actions"}>
                    <h3>Actions</h3>
                    <ul className={"ability-list"}>
                        {statblock.actions.map((action, index) => (
                            <E5Ability ability={action} key={action.name + index} />
                        ))}
                    </ul>
                </div>
            ) : null}
            {statblock.reactions && statblock.reactions.length > 0 ? (
                <div className={"reactions"}>
                    <h3>Reactions</h3>
                    <ul className={"ability-list"}>
                        {statblock.reactions?.map((reaction, index) => (
                            <E5Ability ability={reaction} key={reaction.name + index} />
                        ))}
                    </ul>
                </div>
            ) : null}
            {statblock.special_abilities && statblock.special_abilities.length > 0 ? (
                <div className={"special-abilities"}>
                    <h3>Special Abilities</h3>
                    <ul className={"ability-list"}>
                        {statblock.special_abilities?.map((ability, index) => (
                            <E5Ability ability={ability} key={ability.name + index} />
                        ))}
                    </ul>
                </div>
            ) : null}
            {(statblock.legendary_actions && statblock.legendary_actions.length > 0) || !!statblock.legendary_desc ? (
                <div className={"legendary-actions"}>
                    <h3>Legendary Actions</h3>
                    {statblock.legendary_desc}
                    <ul className={"ability-list"}>
                        {statblock.legendary_actions?.map((legendary_action, index) => (
                            <E5Ability ability={legendary_action} key={legendary_action.name + index} />
                        ))}
                    </ul>
                </div>
            ) : null}
            {statblock.spells && statblock.spells.length > 0 ? <E5Spells spells={statblock.spells} /> : null}
        </div>
    ) : null;
};

const PfStatBlock = ({ slug }: { slug: string }) => {
    const { characterId } = useCharSheet();
    const creatureQuery = usePfGetStatblock(slug);

    const creature = creatureQuery.isSuccess && creatureQuery.data ? creatureQuery.data : null;

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
                                {value * 2 + 10} (
                                {Intl.NumberFormat("en-US", { signDisplay: "exceptZero" }).format(value)})
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
            {creature.items?.length && creature.items.length > 0 ? (
                <div className={"items"}>
                    <b>Items</b>: {creature.items.join(", ")}
                </div>
            ) : null}
            {creature.immunities?.length && creature.immunities.length > 0 ? (
                <div className={"immunities"}>
                    <b>Immunities</b>: {creature.immunities.join(", ")}
                </div>
            ) : null}
            {creature.weaknesses?.length && creature.weaknesses.length > 0 ? (
                <div className={"weaknesses"}>
                    <b>Weaknesses</b>: {creature.weaknesses.join(", ")}
                </div>
            ) : null}
            {creature.resistances?.length && creature.resistances.length > 0 ? (
                <div className={"resistances"}>
                    <b>Resistances</b>: {creature.resistances.join(", ")}
                </div>
            ) : null}

            <div className={"actions"}>
                <h3>Actions</h3>
                <ul className={"ability-list"}>
                    {creature.actions.map((action, index) => {
                        return <PfAbility key={index} ability={action} />;
                    })}
                </ul>
            </div>
            {creature.reactions && creature.reactions.length > 0 ? (
                <div className={"reactions"}>
                    <h3>Reactions</h3>
                    <ul className={"ability-list"}>
                        {creature.reactions?.map((reaction, index) => {
                            return <PfAbility key={index} ability={reaction} />;
                        })}
                    </ul>
                </div>
            ) : null}
            <div className={"special-abilities"}>
                <h3>Special Abilities</h3>
                <ul className={"ability-list"}>
                    {creature.special_abilities?.map((ability, index) => {
                        return <PfAbility key={index} ability={ability} />;
                    })}
                </ul>
            </div>
            <div className={"spells"}>
                <h3>Spells</h3>
                {creature.spells?.map((spells, index) => {
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
                                    ?.sort((a, b) => {
                                        if (a.type === "CANTRIP") {
                                            return -1;
                                        }
                                        if (b.type === "SPELL") {
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
                                                    <b>Type</b>: {list.type.toLowerCase()}
                                                </span>
                                                <span>
                                                    <b>Level</b>: {list.level}
                                                </span>
                                                <span>
                                                    <b>Spells</b>: {list.spells?.map((spell) => spell.name).join(", ")}
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
    const [ruleset, _] = useLocalStorage<Ruleset>(`${ID}.ruleset`, "e5");
    return <>{ruleset === "e5" ? <E5StatBlock slug={slug} /> : <PfStatBlock slug={slug} />}</>;
};
