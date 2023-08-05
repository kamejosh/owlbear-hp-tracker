import React, { useEffect, useRef, useState } from "react";
import { useCharSheet } from "../../../context/CharacterContext.ts";
import "./character-sheet.scss";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../../helper/variables.ts";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { SearchResult, useGetOpen5eMonster, useOpen5eSearch } from "../../../open5e/useOpen5e.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";

export const Open5eSheet = ({ slug }: { slug: string }) => {
    const { characterId } = useCharSheet();
    const monsterQuery = useGetOpen5eMonster(slug);

    const data = monsterQuery.isSuccess ? monsterQuery.data : null;

    const specialAbillities = data && typeof data.special_abilities !== "string" ? data.special_abilities : [];

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
        if (monsterQuery.isSuccess && data) {
            updateValues(data.hit_points, data.armor_class);
        }
    }, [monsterQuery.isSuccess]);

    return (
        <div className={"open5e-sheet"}>
            {data ? (
                <>
                    <div className={"what"}>
                        <h3>{data.name}</h3>
                        <span>
                            {data.size} {data.type}, {data.alignment}
                        </span>
                    </div>
                    <div className={"values"}>
                        <span className={"ac"}>
                            <b>Armor Class</b> {data.armor_class} ({data.armor_desc})
                        </span>
                        <span className={"hp"}>
                            <b>Hit Points</b> {data.hit_points} ({data.hit_dice})
                        </span>
                        <span className={"speed"}>
                            <b>Speed</b> walk {data.speed.walk} ft.{" "}
                            {data.speed.fly ? `, fly ${data.speed.fly} ft.` : ""}{" "}
                            {data.speed.swim ? `, swim ${data.speed.swim} ft.` : ""}
                        </span>
                    </div>
                    <div className={"abilities"}>
                        <div className={"ability"}>
                            <div className={"ability-name"}>STR</div>
                            <div className={"ability-value"}>
                                {data.strength} ({Math.floor((data.strength - 10) / 2)})
                            </div>
                        </div>
                        <div className={"ability"}>
                            <div className={"ability-name"}>DEX</div>
                            <div className={"ability-value"}>
                                {data.dexterity} ({Math.floor((data.dexterity - 10) / 2)})
                            </div>
                        </div>
                        <div className={"ability"}>
                            <div className={"ability-name"}>CON</div>
                            <div className={"ability-value"}>
                                {data.constitution} ({Math.floor((data.constitution - 10) / 2)})
                            </div>
                        </div>
                        <div className={"ability"}>
                            <div className={"ability-name"}>INT</div>
                            <div className={"ability-value"}>
                                {data.intelligence} ({Math.floor((data.intelligence - 10) / 2)})
                            </div>
                        </div>
                        <div className={"ability"}>
                            <div className={"ability-name"}>WIS</div>
                            <div className={"ability-value"}>
                                {data.wisdom} ({Math.floor((data.wisdom - 10) / 2)})
                            </div>
                        </div>
                        <div className={"ability"}>
                            <div className={"ability-name"}>CHA</div>
                            <div className={"ability-value"}>
                                {data.charisma} ({Math.floor((data.charisma - 10) / 2)})
                            </div>
                        </div>
                    </div>
                    <div className={"tidbits"}>
                        <div className={"tidbit"}>
                            <b>Senses</b> {data.senses}
                        </div>
                        <div className={"tidbit"}>
                            <b>Languages</b> {data.languages}
                        </div>
                        <div className={"tidbit"}>
                            <b>Challenge</b> {data.challenge_rating}
                        </div>
                    </div>
                    <div className={"actions"}>
                        <h3>Actions</h3>
                        {data.actions.map((action) => {
                            return (
                                <div key={action.name} className={"action"}>
                                    <b>{action.name}.</b> {action.desc}
                                </div>
                            );
                        })}
                    </div>
                    {data.special_abilities ? (
                        <div className={"special-abilities"}>
                            <h3>Special Abilities</h3>
                            {specialAbillities.map((ability) => {
                                return (
                                    <div key={ability.name} className={"action"}>
                                        <b>{ability.name}.</b> {ability.desc}
                                    </div>
                                );
                            })}
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
};

const SearchResult = ({ entries }: { entries: Array<SearchResult> }) => {
    const { characterId } = useCharSheet();
    const setSheet = (slug: string) => {
        if (characterId) {
            OBR.scene.items.updateItems([characterId], (items) => {
                items.forEach((item) => {
                    const data = item.metadata[characterMetadata] as HpTrackerMetadata;
                    item.metadata[characterMetadata] = { ...data, sheet: slug };
                });
            });
        }
    };

    return (
        <ul className={"search-results"}>
            {entries.map((entry) => {
                return (
                    <li className={"search-result"} key={entry.slug} onClick={() => setSheet(entry.slug)}>
                        <span>{entry.name}</span>
                        <span>HP: {entry.hit_points}</span>
                        <span>AC: {entry.armor_class}</span>
                        <span>CR: {entry.cr}</span>
                    </li>
                );
            })}
        </ul>
    );
};

export const CharacterSheet = () => {
    const { characterId, setId } = useCharSheet();
    const playerContext = usePlayerContext();
    const [token, setToken] = useState<Item | null>(null);
    const [data, setData] = useState<HpTrackerMetadata | null>(null);
    const [search, setSearch] = useState<string>("");
    const [forceSearch, setForceSearch] = useState<boolean>(false);
    const searchRef = useRef<HTMLInputElement>(null);

    const characterSheetQuery = useOpen5eSearch(search);

    const initData = (items: Item[]) => {
        if (items.length > 0) {
            const item = items[0];
            if (characterMetadata in item.metadata) {
                const d = item.metadata[characterMetadata] as HpTrackerMetadata;
                setData(d);
                if (!d.sheet) {
                    setSearch(d.name);
                }
                setToken(item);
            }
        }
    };

    useEffect(() => {
        const getToken = async () => {
            if (characterId) {
                const items = await OBR.scene.items.getItems([characterId]);

                initData(items);
            }
        };

        getToken();
    }, [characterId]);

    useEffect(() => {
        OBR.scene.items.onChange(async (items) => {
            const filteredItems = items.filter((item) => item.id === characterId);
            initData(filteredItems);
        });
    }, []);

    useEffect(() => {
        setForceSearch(false);
    }, [data?.sheet]);

    return (
        <div className={"character-sheet"}>
            <button className={"back-button"} onClick={() => setId(null)}>
                Back
            </button>
            {token && data ? (
                <div className={"content"}>
                    <h2>{data.name}</h2>
                    {playerContext.role === "GM" ? (
                        <div className={"search-wrapper"}>
                            <input
                                ref={searchRef}
                                type={"text"}
                                defaultValue={data.name}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setSearch(e.currentTarget.value);
                                        setForceSearch(true);
                                    }
                                }}
                                onBlur={(e) => {
                                    setSearch(e.target.value);
                                    setForceSearch(true);
                                }}
                            />
                            <button
                                className={"only-icon search"}
                                onClick={() => {
                                    setForceSearch(true);
                                    setSearch(searchRef.current!.value);
                                }}
                            />
                        </div>
                    ) : null}
                    {data.sheet && !forceSearch ? (
                        <Open5eSheet slug={data.sheet} />
                    ) : search !== "" && characterSheetQuery.isSuccess && characterSheetQuery.data ? (
                        <SearchResult entries={characterSheetQuery.data.results} />
                    ) : (
                        <></>
                    )}
                </div>
            ) : null}
        </div>
    );
};
