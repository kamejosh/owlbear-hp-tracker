import { useCharSheet } from "../../../context/CharacterContext.ts";
import { Loader } from "../../general/Loader.tsx";
import { E5Statblock, useE5SearchStatblock } from "../../../api/e5/useE5Api.ts";
import { PfStatblock, usePfStatblockSearch } from "../../../api/pf/usePfApi.ts";
import { useEffect } from "react";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateTokenSheet } from "../../../helper/helpers.ts";
import { useShallow } from "zustand/react/shallow";

type SearchResultProps = {
    search: string;
    setForceSearch: (forceSearch: boolean) => void;
    current: string;
    setEmpty: (empty: boolean) => void;
};

export const SearchResult5e = (props: SearchResultProps) => {
    const characterId = useCharSheet(useShallow((state) => state.characterId));
    const room = useMetadataContext(useShallow((state) => state.room));
    const setSheet = (statblock: E5Statblock) => {
        if (characterId) {
            if (statblock.slug === props.current) {
                props.setForceSearch(false);
            }
            updateTokenSheet(statblock, characterId, "e5");
        }
    };

    const searchQuery = useE5SearchStatblock(props.search, 200, 0, room?.tabletopAlmanacAPIKey);

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
                                onClick={() => setSheet(entry)}
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
    const room = useMetadataContext(useShallow((state) => state.room));
    const characterId = useCharSheet(useShallow((state) => state.characterId));
    const setSheet = (statblock: PfStatblock) => {
        if (characterId) {
            if (statblock.slug === props.current) {
                props.setForceSearch(false);
            }
            updateTokenSheet(statblock, characterId, "pf");
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
                                onClick={() => setSheet(entry)}
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
