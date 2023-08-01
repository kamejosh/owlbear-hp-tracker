import React, { useEffect, useState } from "react";
import { useCharSheet } from "../../../context/CharacterContext.ts";
import "./character-sheet.scss";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../../helper/variables.ts";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { SearchResult, useOpen5eSearch } from "../../../open5e/useOpen5e.ts";

const SearchResult = ({ entries }: { entries: Array<SearchResult> }) => {
    return (
        <ul className={"search-results"}>
            {entries.map((entry) => {
                return (
                    <li key={entry.slug}>
                        {entry.name} - {entry.cr}
                    </li>
                );
            })}
        </ul>
    );
};

export const CharacterSheet = () => {
    const { characterId, setId } = useCharSheet();
    const [token, setToken] = useState<Item | null>(null);
    const [data, setData] = useState<HpTrackerMetadata | null>(null);
    const [search, setSearch] = useState<string>("");

    const characterSheetQuery = useOpen5eSearch(search);

    console.log(characterSheetQuery.data?.results);

    useEffect(() => {
        const getToken = async () => {
            if (characterId) {
                const items = await OBR.scene.items.getItems([characterId]);

                if (items.length > 0) {
                    const item = items[0];
                    if (characterMetadata in item.metadata) {
                        setData(item.metadata[characterMetadata] as HpTrackerMetadata);
                        setToken(item);
                    }
                }
            }
        };

        getToken();
    }, [characterId]);

    return (
        <div className={"character-sheet"}>
            <button className={"back-button"} onClick={() => setId(null)}>
                Back
            </button>
            {token && data ? (
                <div className={"content"}>
                    <h2>{data.name}</h2>
                    <input
                        type={"text"}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                setSearch(e.currentTarget.value);
                            }
                        }}
                        onBlur={(e) => {
                            setSearch(e.target.value);
                        }}
                    />
                    {search !== "" && characterSheetQuery.isSuccess && characterSheetQuery.data ? (
                        <SearchResult entries={characterSheetQuery.data.results} />
                    ) : (
                        <></>
                    )}
                </div>
            ) : null}
        </div>
    );
};
