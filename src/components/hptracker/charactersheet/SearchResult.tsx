import { useCharSheet } from "../../../context/CharacterContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../../helper/variables.ts";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { Loader } from "../../general/Loader.tsx";
import { E5Statblock, useE5SearchStatblock } from "../../../ttrpgapi/e5/useE5Api.ts";
import { PfStatblock, usePfStatblockSearch } from "../../../ttrpgapi/pf/usePfApi.ts";

export const SearchResult5e = ({ search }: { search: string }) => {
    const { characterId } = useCharSheet();
    const setSheet = (slug: string, bonus: number) => {
        if (characterId) {
            OBR.scene.items.updateItems([characterId], (items) => {
                items.forEach((item) => {
                    const data = item.metadata[characterMetadata] as HpTrackerMetadata;
                    item.metadata[characterMetadata] = {
                        ...data,
                        sheet: slug,
                        ruleset: "e5",
                        stats: { initiativeBonus: bonus },
                    };
                });
            });
        }
    };

    const searchQuery = useE5SearchStatblock(search, 10, 0);

    const entries = searchQuery.isSuccess && searchQuery.data ? searchQuery.data : [];

    return searchQuery.isFetching ? (
        <Loader className={"search-loader"} />
    ) : searchQuery.isSuccess ? (
        <ul className={"search-results"}>
            {entries.map((entry: E5Statblock) => {
                return (
                    <li
                        className={"search-result"}
                        key={entry.slug}
                        onClick={() => setSheet(entry.slug, Math.floor((entry.stats.dexterity - 10) / 2))}
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
        <div className={"error"}>An Error occurred please try again.</div>
    );
};

export const SearchResultPf = ({ search }: { search: string }) => {
    const { characterId } = useCharSheet();
    const setSheet = (slug: string, bonus: number) => {
        if (characterId) {
            OBR.scene.items.updateItems([characterId], (items) => {
                items.forEach((item) => {
                    const data = item.metadata[characterMetadata] as HpTrackerMetadata;
                    item.metadata[characterMetadata] = {
                        ...data,
                        sheet: slug,
                        ruleset: "pf",
                        stats: { initiativeBonus: bonus },
                    };
                });
            });
        }
    };

    const searchQuery = usePfStatblockSearch(search, 10, 0);

    const entries = searchQuery.isSuccess && searchQuery.data ? searchQuery.data : [];

    return searchQuery.isFetching ? (
        <Loader className={"search-loader"} />
    ) : searchQuery.isSuccess ? (
        <ul className={"search-results"}>
            {entries.map((entry: PfStatblock) => {
                return (
                    <li
                        className={"search-result"}
                        key={entry.slug}
                        onClick={() => setSheet(entry.slug, entry.stats.dexterity)}
                    >
                        <span>{entry.name}</span>
                        <span>HP: {entry.hp.value}</span>
                        <span>AC: {entry.armor_class.value}</span>
                        <span>Level: {entry.level}</span>
                    </li>
                );
            })}
        </ul>
    ) : (
        <div className={"error"}>An Error occurred please try again.</div>
    );
};
