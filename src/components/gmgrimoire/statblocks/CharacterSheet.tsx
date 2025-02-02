import { ReactElement, useEffect, useRef, useState } from "react";
import { useCharSheet } from "../../../context/CharacterContext.ts";
import OBR, { Image } from "@owlbear-rodeo/sdk";
import { settingsModal } from "../../../helper/variables.ts";
import { GMGMetadata, Ruleset } from "../../../helper/types.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { SearchResult5e, SearchResultPf } from "./SearchResult.tsx";
import { Statblock } from "./Statblock.tsx";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { getSearchString, getTokenName, updateRoomMetadata } from "../../../helper/helpers.ts";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { useShallow } from "zustand/react/shallow";

type SearchWrapperProps = {
    name: string;
    setSearch: (search: string) => void;
    setForceSearch: (force: boolean) => void;
    empty: boolean;
};

type StatblockWrapperProps = {
    data: GMGMetadata;
    forceSearch: boolean;
    setForceSearch: (forceSearch: boolean) => void;
    search: string;
    itemId: string;
    setEmpty: (empty: boolean) => void;
};

const SearchWrapper = (props: SearchWrapperProps) => {
    const playerContext = usePlayerContext();
    const room = useMetadataContext(useShallow((state) => state.room));

    const searchRef = useRef<HTMLInputElement>(null);

    return (
        <>
            {playerContext.role === "GM" ? (
                <div className={"top-wrapper"}>
                    {!room?.tabletopAlmanacAPIKey ? (
                        <div className={"custom-statblock-wrapper"}>
                            To create custom statblocks go to{" "}
                            <a href={"https://tabletop-almanac.com"} target={"_blank"}>
                                Tabletop Almanac
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
                            defaultValue={getSearchString(props.name)}
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
    const room = useMetadataContext(useShallow((state) => state.room));
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
                <Statblock id={props.itemId} />
            ) : props.search !== "" ? (
                ruleSetMap.get(room?.ruleset || "e5")
            ) : (
                <></>
            )}
        </>
    );
};

export const CharacterSheet = (props: { itemId: string }) => {
    const { setId } = useCharSheet();
    const playerContext = usePlayerContext();
    const room = useMetadataContext(useShallow((state) => state.room));
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(props.itemId)));
    const item = token?.item as Image;
    const data = token?.data as GMGMetadata;
    const [search, setSearch] = useState<string>("");
    const [forceSearch, setForceSearch] = useState<boolean>(false);
    const [emptySearch, setEmptySearch] = useState<boolean>(false);
    const [backgroundColor, setBackgroundColor] = useState<string>();

    const initData = async () => {
        if (playerContext.role !== "GM" && item.createdUserId === OBR.player.id) {
            setBackgroundColor(await OBR.player.getColor());
        }
    };

    useEffect(() => {
        if (item) {
            initData();
        } else {
            setId(null);
        }
    }, [item]);

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
            {item && data ? (
                <div className={"content"}>
                    <div className={"statblock-top"}>
                        <h2 className={"statblock-name"}>
                            {getTokenName(item)} <span className={"note"}>(using {room?.ruleset} Filter)</span>
                        </h2>
                    </div>
                    {room?.ruleset === "e5" || room?.ruleset === "pf" ? (
                        <>
                            <SearchWrapper
                                name={getTokenName(item)}
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
