import { useCharSheet } from "../../../context/CharacterContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../../helper/variables.ts";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { useEffect, useState } from "react";
import { PfAbility } from "./PfAbility.tsx";
import { useE5GetStatblock } from "../../../ttrpgapi/e5/useE5Api.ts";
import { usePfGetStatblock } from "../../../ttrpgapi/pf/usePfApi.ts";
import { E5Ability } from "./E5Ability.tsx";
import { E5Spells } from "./E5Spells.tsx";
import { PfSpells } from "./PfSpells.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { DiceButton, DiceButtonWrapper } from "../../general/DiceRoller/DiceButtonWrapper.tsx";

const E5StatBlock = ({ slug }: { slug: string }) => {
    const statblockQuery = useE5GetStatblock(slug);

    const statblock = statblockQuery.isSuccess && statblockQuery.data ? statblockQuery.data : null;

    const { characterId } = useCharSheet();

    const updateValues = (maxHp: number, ac: number) => {
        if (characterId) {
            OBR.scene.items.updateItems([characterId], (items) => {
                items.forEach((item) => {
                    const data = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                    if (data.hp === 0 && data.maxHp === 0 && data.armorClass === 0) {
                        item.metadata[itemMetadataKey] = {
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
                    <b>Hit Points</b> {statblock.hp.value}{" "}
                    {statblock.hp.hit_dice ? (
                        <DiceButton
                            dice={statblock.hp.hit_dice}
                            text={statblock.hp.hit_dice}
                            context={slug + ": Hit Dice"}
                        />
                    ) : null}
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
                                {value}
                                <DiceButton
                                    dice={"d20"}
                                    text={Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                        Math.floor((value - 10) / 2)
                                    )}
                                    context={`${stat} Check`}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={"tidbits"}>
                {Object.entries(statblock.saving_throws).filter((st) => !!st[1]).length > 0 ? (
                    <div className={"tidbit saving-throws"}>
                        <b>Saving Throws</b>{" "}
                        {Object.entries(statblock.saving_throws)
                            .map(([key, value]) => {
                                if (value) {
                                    return (
                                        <span className={"saving-throw"} key={key}>
                                            {key.substring(0, 3)}:{" "}
                                            {DiceButtonWrapper("+" + value, `${key} saving-throw`)}
                                        </span>
                                    );
                                }
                            })
                            .filter((v) => !!v)}
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
            {statblock.skills && Object.entries(statblock.skills).filter(([_, value]) => !!value).length > 0 ? (
                <div className={"skills"}>
                    <h3>Skills</h3>
                    <ul className={"skill-list"}>
                        {Object.entries(statblock.skills).map(([key, value], index) => {
                            if (value) {
                                return (
                                    <li className={"skill"} key={index}>
                                        <b>{key}</b>:{" "}
                                        {DiceButtonWrapper(
                                            Intl.NumberFormat("en-US", { signDisplay: "always" }).format(value),
                                            `${key} check`
                                        )}
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
    const statblockQuery = usePfGetStatblock(slug);

    const statblock = statblockQuery.isSuccess && statblockQuery.data ? statblockQuery.data : null;

    const updateValues = (maxHp: number, ac: number) => {
        if (characterId) {
            OBR.scene.items.updateItems([characterId], (items) => {
                items.forEach((item) => {
                    const data = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                    if (data.hp === 0 && data.maxHp === 0 && data.armorClass === 0) {
                        item.metadata[itemMetadataKey] = {
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
        <div className={"pf-sheet"}>
            <div className={"what"}>
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
            </div>
            <div className={"values"}>
                <span className={"ac"}>
                    <b>Armor Class</b> {statblock.armor_class.value}{" "}
                    {statblock.armor_class.special ? `(${statblock.armor_class.special})` : null}
                </span>
                <span className={"hp"}>
                    <b>Hit Points</b> {statblock.hp.value} {statblock.hp.special ? `(${statblock.hp.special})` : null}
                </span>
                <span className={"speed"}>
                    <b>Speed</b> {statblock.speed}
                </span>
                <span className={"perception"}>
                    <b>Perception</b> {DiceButtonWrapper(statblock.perception!, "perception Check")}
                </span>
            </div>
            <div className={"stats"}>
                {Object.entries(statblock.stats).map(([stat, value]) => {
                    return (
                        <div className={"stat"} key={stat}>
                            <div className={"stat-name"}>{stat.substring(0, 3)}</div>
                            <div className={"stat-value"}>
                                {DiceButtonWrapper(
                                    Intl.NumberFormat("en-US", { signDisplay: "always" }).format(value),
                                    `${stat} Check`
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={"saving-throws"}>
                {Object.entries(statblock.saving_throws).filter((st) => !!st[1]).length > 0 ? (
                    <>
                        <b>Saving Throws</b>
                        <ul className={"saving-throw-list"}>
                            {Object.entries(statblock.saving_throws).map(([key, value], index) => {
                                if (value) {
                                    return (
                                        <li key={index}>
                                            <span className={"name"}>{key}</span>{" "}
                                            {DiceButtonWrapper("+" + value, `${key} saving-throw`)}
                                        </li>
                                    );
                                }
                            })}
                        </ul>
                    </>
                ) : null}
            </div>
            {statblock.skills && statblock.skills.length > 0 ? (
                <div className={"skills"}>
                    <h3>Skills</h3>
                    <div className={"skill-list"}>
                        {statblock.skills?.map((skill) => {
                            return (
                                <div className={"skill"} key={skill.name}>
                                    <div className={"skill-name"}>{skill.name}</div>
                                    <div className={"skill-value"}>
                                        {DiceButtonWrapper(skill.value, `${skill.name} Check`)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : null}
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

            <div className={"actions"}>
                <h3>Actions</h3>
                <ul className={"ability-list"}>
                    {statblock.actions.map((action, index) => {
                        return <PfAbility key={index} ability={action} />;
                    })}
                </ul>
            </div>
            {statblock.reactions && statblock.reactions.length > 0 ? (
                <div className={"reactions"}>
                    <h3>Reactions</h3>
                    <ul className={"ability-list"}>
                        {statblock.reactions?.map((reaction, index) => {
                            return <PfAbility key={index} ability={reaction} />;
                        })}
                    </ul>
                </div>
            ) : null}
            {statblock.special_abilities && statblock.special_abilities.length > 0 ? (
                <div className={"special-abilities"}>
                    <h3>Special Abilities</h3>
                    <ul className={"ability-list"}>
                        {statblock.special_abilities?.map((ability, index) => {
                            return <PfAbility key={index} ability={ability} />;
                        })}
                    </ul>
                </div>
            ) : null}
            {statblock.spells && statblock.spells.length > 0 ? <PfSpells spells={statblock.spells} /> : null}
        </div>
    ) : null;
};

export const Statblock = (props: { data: HpTrackerMetadata; itemId: string }) => {
    const { room } = useMetadataContext();
    const [data, setData] = useState<HpTrackerMetadata>(props.data);

    useEffect(() => {
        setData(props.data);
    }, [props.data]);

    return (
        <div className={"statblock-wrapper"}>
            <div className={"initiative-bonus"}>
                {"Initiative Bonus"}
                <input
                    type={"text"}
                    size={1}
                    value={data.stats.initiativeBonus}
                    onChange={async (e) => {
                        const factor = e.target.value.startsWith("-") ? -1 : 1;
                        const value = Number(e.target.value.replace(/[^0-9]/g, ""));
                        const newData: HpTrackerMetadata = {
                            ...data,
                            stats: { ...data.stats, initiativeBonus: factor * value },
                        };

                        setData({ ...newData });

                        await OBR.scene.items.updateItems([props.itemId], (items) => {
                            items.forEach((item) => {
                                item.metadata[itemMetadataKey] = { ...newData };
                            });
                        });
                    }}
                />
            </div>
            {room && room.ruleset === "e5" ? (
                <E5StatBlock slug={props.data.sheet} />
            ) : (
                <PfStatBlock slug={props.data.sheet} />
            )}
        </div>
    );
};
