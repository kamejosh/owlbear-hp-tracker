import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { GMGMetadata } from "../../../helper/types.ts";
import { useCharSheet } from "../../../context/CharacterContext.ts";
import { SheetSvg } from "../../svgs/SheetSvg.tsx";
import { DeleteSvg } from "../../svgs/DeleteSvg.tsx";
import "./sheet.scss";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";
import { useEffect, useState } from "react";
import OBR, { Image, Player } from "@owlbear-rodeo/sdk";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import Tippy from "@tippyjs/react";
import { statblockPopover } from "../../../helper/variables.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { updateSceneMetadata } from "../../../helper/helpers.ts";

export const Sheet = ({ id }: { id: string }) => {
    const [room, scene] = useMetadataContext((state) => [state.room, state.scene]);
    const playerContext = usePlayerContext();
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const setId = useCharSheet((state) => state.setId);
    const data = token?.data as GMGMetadata;
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
                    <Tippy content={"open statblock (RMB in popover)"}>
                        <button
                            onClick={() => setId(id)}
                            onContextMenu={async (e) => {
                                e.preventDefault();
                                let width = 10000;
                                let height = 600;
                                try {
                                    width = await OBR.viewport.getWidth();
                                    height = await OBR.viewport.getHeight();
                                } catch {}

                                const statblockPopoverOpen: { [key: string]: boolean } = scene?.statblockPopoverOpen
                                    ? { ...scene.statblockPopoverOpen }
                                    : {};
                                statblockPopoverOpen[OBR.player.id] = true;
                                await updateSceneMetadata(scene, { statblockPopoverOpen: statblockPopoverOpen });
                                await OBR.player.select([id]);
                                await OBR.popover.open({
                                    ...statblockPopover,
                                    width: Math.min(room?.statblockPopover?.width || 500, width),
                                    height: Math.min(room?.statblockPopover?.height || 600, height),
                                    anchorPosition: { top: 55, left: width - 70 },
                                });
                            }}
                        >
                            open
                        </button>
                    </Tippy>
                    <Tippy content={"Remove statblock"}>
                        <button
                            className={"remove-statblock"}
                            onClick={async () => {
                                const newData = { ...data, sheet: "" };
                                await updateTokenMetadata(newData, [id]);
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
                                // this doesn't work with the abstraction layer
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
