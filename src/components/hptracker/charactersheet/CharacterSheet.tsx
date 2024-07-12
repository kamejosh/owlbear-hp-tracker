import { ReactElement, useEffect, useRef, useState } from "react";
import { useCharSheet } from "../../../context/CharacterContext.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { itemMetadataKey, settingsModal } from "../../../helper/variables.ts";
import { HpTrackerMetadata, Ruleset } from "../../../helper/types.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { SearchResult5e, SearchResultPf } from "./SearchResult.tsx";
import { Statblock } from "./Statblock.tsx";
import { Helpbuttons } from "../../general/Helpbuttons/Helpbuttons.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateRoomMetadata } from "../../../helper/helpers.ts";

type SearchWrapperProps = {
    data: HpTrackerMetadata;
    setSearch: (search: string) => void;
    setForceSearch: (force: boolean) => void;
    empty: boolean;
};

type StatblockWrapperProps = {
    data: HpTrackerMetadata;
    forceSearch: boolean;
    setForceSearch: (forceSearch: boolean) => void;
    search: string;
    itemId: string;
    setEmpty: (empty: boolean) => void;
};

const getSearchString = (name: string): string => {
    const nameParts = name.split(" ");
    const lastToken = nameParts[nameParts.length - 1];
    if (lastToken.length < 3 || /^\d+$/.test(lastToken) || /\d/.test(lastToken)) {
        return nameParts.slice(0, nameParts.length - 1).join(" ");
    }
    return name;
};

const SearchWrapper = (props: SearchWrapperProps) => {
    const playerContext = usePlayerContext();
    const room = useMetadataContext((state) => state.room);

    const searchRef = useRef<HTMLInputElement>(null);

    return (
        <>
            {playerContext.role === "GM" ? (
                <div className={"top-wrapper"}>
                    {!room?.tabletopAlmanacAPIKey ? (
                        <div className={"custom-statblock-wrapper"}>
                            To create custom statblocks go to{" "}
                            <a href={"https://tabletop-almanac.com"} target={"_blank"}>
                                Tabletop Alamanc
                            </a>{" "}
                            and enter you API Key here:
                            <input
                                type={"text"}
                                onBlur={(e) => {
                                    updateRoomMetadata(room, { tabletopAlmanacAPIKey: e.currentTarget.value });
                                }}
                            />
                        </div>
                    ) : null}
                    <div className={"search-wrapper"}>
                        <input
                            ref={searchRef}
                            type={"text"}
                            className={props.empty ? "empty" : ""}
                            title={
                                props.empty
                                    ? "No results for this input, try another name"
                                    : "Enter the name of the creature you're searching"
                            }
                            defaultValue={getSearchString(props.data.name)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    props.setSearch(e.currentTarget.value);
                                    props.setForceSearch(true);
                                }
                            }}
                            onBlur={(e) => {
                                props.setSearch(e.target.value);
                                props.setForceSearch(true);
                            }}
                        />
                        <button
                            className={"only-icon search"}
                            onClick={() => {
                                props.setForceSearch(true);
                                props.setSearch(searchRef.current!.value);
                            }}
                        />
                    </div>
                </div>
            ) : null}
        </>
    );
};

const StatblockWrapper = (props: StatblockWrapperProps) => {
    const room = useMetadataContext((state) => state.room);
    const ruleSetMap = new Map<Ruleset, ReactElement>([
        [
            "pf",
            <SearchResultPf
                search={props.search}
                setForceSearch={props.setForceSearch}
                current={props.data.sheet}
                setEmpty={props.setEmpty}
            />,
        ],
        [
            "e5",
            <SearchResult5e
                search={props.search}
                setForceSearch={props.setForceSearch}
                current={props.data.sheet}
                setEmpty={props.setEmpty}
            />,
        ],
    ]);

    return (
        <>
            {props.data.sheet && !props.forceSearch ? (
                <Statblock data={props.data} itemId={props.itemId} />
            ) : props.search !== "" ? (
                ruleSetMap.get(room?.ruleset || "e5")
            ) : (
                <></>
            )}
        </>
    );
};

export const CharacterSheet = (props: { itemId: string }) => {
    const { characterId, setId } = useCharSheet();
    const playerContext = usePlayerContext();
    const room = useMetadataContext((state) => state.room);
    const [token, setToken] = useState<Item | null>(null);
    const [data, setData] = useState<HpTrackerMetadata | null>(null);
    const [search, setSearch] = useState<string>("");
    const [forceSearch, setForceSearch] = useState<boolean>(false);
    const [emptySearch, setEmptySearch] = useState<boolean>(false);
    const [backgroundColor, setBackgroundColor] = useState<string>();

    const initData = async (items: Item[]) => {
        if (items.length > 0) {
            const item = items[0];
            if (playerContext.role !== "GM" && item.createdUserId === OBR.player.id) {
                setBackgroundColor(await OBR.player.getColor());
            }
            if (itemMetadataKey in item.metadata) {
                const d = item.metadata[itemMetadataKey] as HpTrackerMetadata;
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
        if (data?.sheet && data?.ruleset === room?.ruleset) {
            setForceSearch(false);
        } else if (!data?.sheet || data?.ruleset === room?.ruleset) {
            setForceSearch(true);
        }
    }, [data?.sheet]);

    return (
        <div className={`character-sheet`}>
            {backgroundColor ? (
                <div className={"background"} style={{ borderLeft: `5px solid ${backgroundColor}` }}></div>
            ) : null}
            <button className={"back-button"} onClick={() => setId(null)}>
                Back
            </button>
            <Helpbuttons />
            {token && data ? (
                <div className={"content"}>
                    <h2 className={"statblock-name"}>
                        {data.name} <span className={"note"}>(using {room?.ruleset} Filter)</span>
                    </h2>
                    {room?.ruleset === "e5" || room?.ruleset === "pf" ? (
                        <>
                            <SearchWrapper
                                data={data}
                                setSearch={setSearch}
                                setForceSearch={setForceSearch}
                                empty={emptySearch}
                            />
                            <StatblockWrapper
                                data={data}
                                search={search}
                                forceSearch={forceSearch}
                                setForceSearch={setForceSearch}
                                itemId={props.itemId}
                                setEmpty={setEmptySearch}
                            />
                        </>
                    ) : (
                        <div className={"ruleset-error"}>
                            Ruleset error! Go to
                            <button
                                className={""}
                                onClick={async () => await OBR.modal.open(settingsModal)}
                                title={"Settings"}
                            >
                                Settings
                            </button>
                            and toggle Ruleset setting to fix error.
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
};
