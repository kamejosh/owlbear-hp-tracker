import { useCharSheet } from "../../../context/CharacterContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import { characterMetadata, ID } from "../../../helper/variables.ts";
import { HpTrackerMetadata, Ruleset } from "../../../helper/types.ts";
import { useEffect } from "react";
import { PfAbility } from "./PfAbility.tsx";
import { useE5GetCreature } from "../../../ttrpgapi/e5/useE5Api.ts";
import { usePfGetStatblock } from "../../../ttrpgapi/pf/usePfApi.ts";
import { useLocalStorage } from "../../../helper/hooks.ts";
import { E5Ability } from "./E5Ability.tsx";
import { E5Spells } from "./E5Spells.tsx";

const E5StatBlock = ({ slug }: { slug: string }) => {
    const creatureQuery = useE5GetCreature(slug);

    const creature = creatureQuery.isSuccess && creatureQuery.data ? creatureQuery.data : null;

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
                    {creature.size} {creature.type} {creature.subtype ? `, ${creature.subtype}` : null}
                    {creature.alignment ? `, ${creature.alignment}` : null}
                    {creature.group ? `, ${creature.group}` : null}
                </span>
            </div>
            <div className={"values"}>
                <span className={"ac"}>
                    <b>Armor Class</b> {creature.armor_class.value}{" "}
                    {!!creature.armor_class.special ? `(${creature.armor_class.special})` : null}
                </span>
                <span className={"hp"}>
                    <b>Hit Points</b> {creature.hp.value} {creature.hp.hit_dice ? `(${creature.hp.hit_dice})` : null}
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
                {Object.entries(creature.saving_throws).filter((st) => !!st[1]).length > 0 ? (
                    <div className={"tidbit"}>
                        <b>Saving Throws</b>{" "}
                        {Object.entries(creature.saving_throws)
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
                    <b>Senses</b> {creature.senses?.join(", ")}
                </div>
                <div className={"tidbit"}>
                    <b>Languages</b> {creature.languages?.join(", ")}
                </div>
                <div className={"tidbit"}>
                    <b>Challenge</b> {creature.challenge_rating}
                </div>
            </div>
            <div className={"resistances"}>
                {creature.damage_vulnerabilities ? (
                    <>
                        <h3>Damage Vulnerabilities</h3> {creature.damage_vulnerabilities}
                    </>
                ) : null}
                {creature.damage_resistances ? (
                    <>
                        <h3>Damage Resistances</h3> {creature.damage_resistances}
                    </>
                ) : null}
                {creature.damage_immunities ? (
                    <>
                        <h3>Damage Immunities</h3> {creature.damage_immunities}
                    </>
                ) : null}
                {creature.condition_immunities ? (
                    <>
                        <h3>Condition Immunities</h3> {creature.condition_immunities}
                    </>
                ) : null}
            </div>
            {creature.actions && creature.actions.length > 0 ? (
                <div className={"actions"}>
                    <h3>Actions</h3>
                    <ul className={"ability-list"}>
                        {creature.actions.map((action, index) => (
                            <E5Ability ability={action} key={action.name + index} />
                        ))}
                    </ul>
                </div>
            ) : null}
            {creature.reactions && creature.reactions.length > 0 ? (
                <div className={"reactions"}>
                    <h3>Reactions</h3>
                    <ul className={"ability-list"}>
                        {creature.reactions?.map((reaction, index) => (
                            <E5Ability ability={reaction} key={reaction.name + index} />
                        ))}
                    </ul>
                </div>
            ) : null}
            {creature.special_abilities && creature.special_abilities.length > 0 ? (
                <div className={"special-abilities"}>
                    <h3>Special Abilities</h3>
                    <ul className={"ability-list"}>
                        {creature.special_abilities?.map((ability, index) => (
                            <E5Ability ability={ability} key={ability.name + index} />
                        ))}
                    </ul>
                </div>
            ) : null}
            {(creature.legendary_actions && creature.legendary_actions.length > 0) || !!creature.legendary_desc ? (
                <div className={"legendary-actions"}>
                    <h3>Legendary Actions</h3>
                    {creature.legendary_desc}
                    <ul className={"ability-list"}>
                        {creature.legendary_actions?.map((legendary_action, index) => (
                            <E5Ability ability={legendary_action} key={legendary_action.name + index} />
                        ))}
                    </ul>
                </div>
            ) : null}
            {creature.spells && creature.spells.length > 0 ? <E5Spells spells={creature.spells} /> : null}
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
