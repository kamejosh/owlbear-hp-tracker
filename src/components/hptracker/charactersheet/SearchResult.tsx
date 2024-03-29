import { useCharSheet } from "../../../context/CharacterContext.ts";
import { Loader } from "../../general/Loader.tsx";
import { E5Statblock, useE5SearchStatblock } from "../../../ttrpgapi/e5/useE5Api.ts";
import { PfStatblock, usePfStatblockSearch } from "../../../ttrpgapi/pf/usePfApi.ts";
import { useEffect } from "react";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateTokenSheet } from "../../../helper/helpers.ts";

type SearchResultProps = {
    search: string;
    setForceSearch: (forceSearch: boolean) => void;
    current: string;
    setEmpty: (empty: boolean) => void;
};

export const SearchResult5e = (props: SearchResultProps) => {
    const { characterId } = useCharSheet();
    const { room } = useMetadataContext();
    const setSheet = (slug: string, bonus: number, hp: number, ac: number) => {
        if (characterId) {
            if (slug === props.current) {
                props.setForceSearch(false);
            }
            updateTokenSheet(slug, bonus, hp, ac, characterId, "e5");
        }
    };

    const searchQuery = useE5SearchStatblock(props.search, 100, 0, room?.tabletopAlmanacAPIKey);

    useEffect(() => {
        if (searchQuery.isSuccess) {
            props.setEmpty(searchQuery.data.length === 0);
        }
    }, [searchQuery.isSuccess]);

    const entries = searchQuery.isSuccess && searchQuery.data ? searchQuery.data : [];

    return searchQuery.isFetching ? (
        <Loader className={"search-loader"} />
    ) : searchQuery.isSuccess ? (
        entries.length > 0 ? (
            <ul className={"search-results"}>
                {entries
                    .sort((a, b) => {
                        if (a.source && ["cc", "tob2", "tob", "tob3", "menagerie", "wotc-srd"].includes(a.source)) {
                            return 1;
                        } else if (
                            b.source &&
                            ["cc", "tob2", "tob", "tob3", "menagerie", "wotc-srd"].includes(b.source)
                        ) {
                            return -1;
                        } else {
                            if (a.name < b.name) {
                                return -1;
                            } else {
                                return 0;
                            }
                        }
                    })
                    .map((entry: E5Statblock) => {
                        return (
                            <li
                                className={`search-result ${entry.slug === props.current ? "current" : ""} ${
                                    entry.source &&
                                    !["cc", "tob2", "tob", "tob3", "menagerie", "wotc-srd"].includes(entry.source)
                                        ? "custom"
                                        : ""
                                }`}
                                key={entry.slug}
                                onClick={() =>
                                    setSheet(
                                        entry.slug,
                                        Math.floor((entry.stats.dexterity - 10) / 2),
                                        entry.hp.value,
                                        entry.armor_class.value
                                    )
                                }
                            >
                                <span>
                                    {entry.name}
                                    {entry.source ? ` (${entry.source})` : null}
                                </span>
                                <span>HP: {entry.hp.value}</span>
                                <span>AC: {entry.armor_class.value}</span>
                                <span>CR: {entry.cr}</span>
                            </li>
                        );
                    })}
            </ul>
        ) : (
            <div className={"empty-search"}>Nothing found for "{props.search}"</div>
        )
    ) : (
        <div className={"error"}>An Error occurred please try again.</div>
    );
};

export const SearchResultPf = (props: SearchResultProps) => {
    const { room } = useMetadataContext();
    const { characterId } = useCharSheet();
    const setSheet = (slug: string, bonus: number, hp: number, ac: number) => {
        if (characterId) {
            if (slug === props.current) {
                props.setForceSearch(false);
            }
            updateTokenSheet(slug, bonus, hp, ac, characterId, "pf");
        }
    };

    const searchQuery = usePfStatblockSearch(props.search, 100, 0, room?.tabletopAlmanacAPIKey);

    useEffect(() => {
        if (searchQuery.isSuccess) {
            props.setEmpty(searchQuery.data.length === 0);
        }
    }, [searchQuery.isSuccess]);

    const entries = searchQuery.isSuccess && searchQuery.data ? searchQuery.data : [];

    return searchQuery.isFetching ? (
        <Loader className={"search-loader"} />
    ) : searchQuery.isSuccess ? (
        entries.length > 0 ? (
            <ul className={"search-results"}>
                {entries
                    .sort((a, b) => {
                        if (a.source) {
                            return -1;
                        } else if (b.source) {
                            return 1;
                        } else {
                            if (a.name < b.name) {
                                return -1;
                            } else {
                                return 0;
                            }
                        }
                    })
                    .map((entry: PfStatblock) => {
                        return (
                            <li
                                className={`search-result ${entry.slug === props.current ? "current" : ""} ${
                                    entry.source ? "custom" : ""
                                }`}
                                key={entry.slug}
                                onClick={() =>
                                    setSheet(
                                        entry.slug,
                                        entry.perception ? parseInt(entry.perception) : 0,
                                        entry.hp.value,
                                        entry.armor_class.value
                                    )
                                }
                            >
                                <span>
                                    {entry.name}
                                    {entry.source ? ` (${entry.source})` : null}
                                </span>
                                <span>HP: {entry.hp.value}</span>
                                <span>AC: {entry.armor_class.value}</span>
                                <span>Level: {entry.level}</span>
                            </li>
                        );
                    })}
            </ul>
        ) : (
            <div className={"empty-search"}>Nothing found for "{props.search}"</div>
        )
    ) : (
        <div className={"error"}>An Error occurred please try again.</div>
    );
};
