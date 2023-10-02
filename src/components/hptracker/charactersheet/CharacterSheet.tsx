import { useEffect, useRef, useState } from "react";
import { useCharSheet } from "../../../context/CharacterContext.ts";
import "./character-sheet.scss";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../../helper/variables.ts";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { Ruleset } from "../../../ttrpgapi/useTtrpgApi.ts";
import { useFilter } from "../../../context/FilterContext.ts";
import { SearchResult5e, SearchResultPf } from "./SearchResult.tsx";
import { Statblock } from "./Statblock.tsx";

export const CharacterSheet = () => {
    const { characterId, setId } = useCharSheet();
    const { ruleset, setRuleset } = useFilter();
    const playerContext = usePlayerContext();
    const [token, setToken] = useState<Item | null>(null);
    const [data, setData] = useState<HpTrackerMetadata | null>(null);
    const [search, setSearch] = useState<string>("");
    const [forceSearch, setForceSearch] = useState<boolean>(false);
    const searchRef = useRef<HTMLInputElement>(null);

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

    const ruleSetMap = new Map<Ruleset, React.JSX.Element>([
        ["pf2e", <SearchResultPf search={search} />],
        ["5e", <SearchResult5e search={search} />],
    ]);

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
                            <label>
                                5e
                                <input
                                    type={"radio"}
                                    value={"5e"}
                                    name={"source"}
                                    checked={ruleset === "5e"}
                                    onClick={() => setRuleset("5e")}
                                    onChange={(e) => setRuleset(e.currentTarget.checked ? "5e" : "pf2e")}
                                />
                            </label>
                            <label>
                                PF2e
                                <input
                                    type={"radio"}
                                    value={"pf2e"}
                                    name={"source"}
                                    checked={ruleset === "pf2e"}
                                    onClick={() => setRuleset("pf2e")}
                                    onChange={(e) => setRuleset(e.currentTarget.checked ? "pf2e" : "5e")}
                                />
                            </label>
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
                        <Statblock slug={data.sheet} />
                    ) : search !== "" ? (
                        ruleSetMap.get(ruleset)
                    ) : (
                        <></>
                    )}
                </div>
            ) : null}
        </div>
    );
};
