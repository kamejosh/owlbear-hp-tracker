import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { useCharSheet } from "../../../context/CharacterContext.ts";
import { SheetSvg } from "../../svgs/SheetSvg.tsx";
import { DeleteSvg } from "../../svgs/DeleteSvg.tsx";
import "./sheet.scss";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useEffect, useState } from "react";
import OBR, { Image, Player } from "@owlbear-rodeo/sdk";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import Tippy from "@tippyjs/react";

export const Sheet = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const setId = useCharSheet((state) => state.setId);
    const data = token?.data as HpTrackerMetadata;
    const item = token?.item as Image;
    const [players, setPlayers] = useState<Array<Player>>([]);
    const owner = players.find((p) => p.id === item.createdUserId)?.id ?? playerContext.id ?? "";

    useEffect(() => {
        const initPlayerList = async () => {
            setPlayers(await OBR.party.getPlayers());
        };

        initPlayerList();
        return OBR.party.onChange((players) => {
            setPlayers(players);
        });
    }, []);

    return (
        <div className={"sheet"}>
            <SheetSvg />
            {data.sheet ? (
                <>
                    <Tippy content={data.sheet}>
                        <button onClick={() => setId(id)}>open</button>
                    </Tippy>
                    <Tippy content={"Remove statblock"}>
                        <button
                            className={"remove-statblock"}
                            onClick={() => {
                                const newData = { ...data, sheet: "" };
                                updateTokenMetadata(newData, [id]);
                            }}
                        >
                            <DeleteSvg />
                        </button>
                    </Tippy>
                </>
            ) : (
                <Tippy content={"Assign statblock"}>
                    <button onClick={() => setId(id)}>assign</button>
                </Tippy>
            )}
            {playerContext.role === "GM" ? (
                <>
                    {item.createdUserId !== playerContext.id ? (
                        <div
                            className={"owner-color"}
                            style={{
                                backgroundColor:
                                    players.find((p) => p.id === item.createdUserId)?.color ?? "transparent",
                            }}
                        ></div>
                    ) : null}
                    <Tippy content={"Assign token owner"}>
                        <select
                            value={owner}
                            onChange={async (e) => {
                                await OBR.scene.items.updateItems([item], (items) => {
                                    items.forEach((item) => {
                                        item.createdUserId = e.target.value;
                                    });
                                });
                            }}
                            className={"select-owner"}
                        >
                            <option value={OBR.player.id}>GM</option>
                            {players.map((player) => {
                                return (
                                    <option key={player.id} value={player.id}>
                                        {player.name}
                                    </option>
                                );
                            })}
                        </select>
                    </Tippy>
                </>
            ) : null}
        </div>
    );
};