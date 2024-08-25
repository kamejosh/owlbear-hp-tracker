import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { useCharSheet } from "../../../context/CharacterContext.ts";
import { SheetSvg } from "../../svgs/SheetSvg.tsx";
import { DeleteSvg } from "../../svgs/DeleteSvg.tsx";
import "./sheet.scss";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useEffect, useRef, useState } from "react";
import tippy, { Instance } from "tippy.js";
import OBR, { Image, Player } from "@owlbear-rodeo/sdk";
import { usePlayerContext } from "../../../context/PlayerContext.ts";

export const Sheet = ({ id }: { id: string }) => {
    const playerContext = usePlayerContext();
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const setId = useCharSheet((state) => state.setId);
    const data = token?.data as HpTrackerMetadata;
    const item = token?.item as Image;
    const buttonRef = useRef(null);
    const [players, setPlayers] = useState<Array<Player>>([]);
    const [tooltip, setTooltip] = useState<Instance>();
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
    useEffect(() => {
        if (buttonRef.current) {
            if (!tooltip) {
                setTooltip(
                    tippy(buttonRef.current, {
                        content: data.sheet,
                    })[0]
                );
            } else {
                tooltip.setContent(data.sheet);
            }
        }
    }, [buttonRef, data.sheet]);

    return (
        <div className={"sheet"}>
            <SheetSvg />
            {data.sheet ? (
                <>
                    <button ref={buttonRef} onClick={() => setId(id)}>
                        open
                    </button>
                    <button
                        className={"remove-statblock"}
                        ref={(e) => {
                            if (e) {
                                tippy(e, { content: "Remove statblock" });
                            }
                        }}
                        onClick={() => {
                            const newData = { ...data, sheet: "" };
                            updateTokenMetadata(newData, [id]);
                        }}
                    >
                        <DeleteSvg />
                    </button>
                </>
            ) : (
                <button
                    ref={(e) => {
                        if (e) {
                            tippy(e, { content: "Assign statblock" });
                        }
                    }}
                    onClick={() => setId(id)}
                >
                    assign
                </button>
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
                        ref={(e) => {
                            if (e) {
                                tippy(e, { content: "Assign Token Owner" });
                            }
                        }}
                    >
                        <option value={OBR.player.id}>GM</option>
                        {players.map((player) => {
                            return <option value={player.id}>{player.name}</option>;
                        })}
                    </select>
                </>
            ) : null}
        </div>
    );
};
