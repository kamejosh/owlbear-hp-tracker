import { useCharSheet } from "../../../context/CharacterContext.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../../helper/variables.ts";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import {
    DnDCreatureOut,
    PFCreatureOut,
    useTtrpgApiSearch5e,
    useTtrpgApiSearchPf,
} from "../../../ttrpgapi/useTtrpgApi.ts";
import { Loader } from "../../general/Loader.tsx";

export const SearchResult5e = ({ search }: { search: string }) => {
    const { characterId } = useCharSheet();
    const playerContext = usePlayerContext();
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

    const searchQuery = useTtrpgApiSearch5e(search, 500, null, playerContext.id);

    const entries = searchQuery.isSuccess && searchQuery.data ? searchQuery.data.data : [];

    return searchQuery.isFetching ? (
        <Loader className={"search-loader"} />
    ) : searchQuery.isSuccess ? (
        <ul className={"search-results"}>
            {entries.map((entry: DnDCreatureOut) => {
                return (
                    <li className={"search-result"} key={entry.slug} onClick={() => setSheet(entry.slug)}>
                        <span>{entry.name}</span>
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
    const playerContext = usePlayerContext();
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

    const searchQuery = useTtrpgApiSearchPf(search, 500, null, playerContext.id);

    const entries = searchQuery.isSuccess && searchQuery.data ? searchQuery.data.data : [];

    return searchQuery.isFetching ? (
        <Loader className={"search-loader"} />
    ) : searchQuery.isSuccess ? (
        <ul className={"search-results"}>
            {entries.map((entry: PFCreatureOut) => {
                return (
                    <li className={"search-result"} key={entry.slug} onClick={() => setSheet(entry.slug)}>
                        <span>{entry.name}</span>
                        <span>HP: {entry.hp.value}</span>
                        <span>AC: {entry.armor_class.value}</span>
                        <span>CR: {entry.level}</span>
                    </li>
                );
            })}
        </ul>
    ) : (
        <div className={"error"}>An Error occurred please try again.</div>
    );
};
