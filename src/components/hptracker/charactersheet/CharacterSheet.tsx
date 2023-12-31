import { ReactElement, useEffect, useRef, useState } from "react";
import { useCharSheet } from "../../../context/CharacterContext.ts";
import "./character-sheet.scss";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { changelogModal, characterMetadata, helpModal, ID, settingsModal } from "../../../helper/variables.ts";
import { HpTrackerMetadata, Ruleset } from "../../../helper/types.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { SearchResult5e, SearchResultPf } from "./SearchResult.tsx";
import { Statblock } from "./Statblock.tsx";
import { useLocalStorage } from "../../../helper/hooks.ts";

export const CharacterSheet = () => {
    const { characterId, setId } = useCharSheet();
    const [ruleset, _] = useLocalStorage<Ruleset>(`${ID}.ruleset`, "e5");
    const playerContext = usePlayerContext();
    const [token, setToken] = useState<Item | null>(null);
    const [data, setData] = useState<HpTrackerMetadata | null>(null);
    const [search, setSearch] = useState<string>("");
    const [forceSearch, setForceSearch] = useState<boolean>(false);
    const searchRef = useRef<HTMLInputElement>(null);

    const getSearchString = (name: string): string => {
        const nameParts = name.split(" ");
        const lastToken = nameParts[nameParts.length - 1];
        if (lastToken.length < 3 || /^\d+$/.test(lastToken) || /\d/.test(lastToken)) {
            return nameParts.slice(0, nameParts.length - 1).join(" ");
        }
        return name;
    };

    const initData = (items: Item[]) => {
        if (items.length > 0) {
            const item = items[0];
            if (characterMetadata in item.metadata) {
                const d = item.metadata[characterMetadata] as HpTrackerMetadata;
                setData(d);
                if (!d.sheet) {
                    setSearch(getSearchString(d.name));
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
        if (data?.sheet && data?.ruleset === ruleset) {
            setForceSearch(false);
        } else {
            setForceSearch(true);
        }
    }, [data?.sheet]);

    const ruleSetMap = new Map<Ruleset, ReactElement>([
        ["pf", <SearchResultPf search={search} />],
        ["e5", <SearchResult5e search={search} />],
    ]);

    return (
        <div className={"character-sheet"}>
            <button className={"back-button"} onClick={() => setId(null)}>
                Back
            </button>
            <div className={"help-buttons"}>
                {playerContext.role == "GM" ? (
                    <button className={"settings-button"} onClick={async () => await OBR.modal.open(settingsModal)}>
                        ⛭
                    </button>
                ) : null}
                <button className={"change-log-button"} onClick={async () => await OBR.modal.open(changelogModal)}>
                    i
                </button>
                <button className={"help-button"} onClick={async () => await OBR.modal.open(helpModal)}>
                    ?
                </button>
            </div>
            {token && data ? (
                <div className={"content"}>
                    <h2>
                        {data.name} <span className={"note"}>(using {ruleset} Filter)</span>
                    </h2>
                    {playerContext.role === "GM" ? (
                        <div className={"search-wrapper"}>
                            <input
                                ref={searchRef}
                                type={"text"}
                                defaultValue={getSearchString(data.name)}
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
