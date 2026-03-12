import { partyStore, usePartyStore } from "../../context/PartyStore.tsx";
import OBR, { Player } from "@owlbear-rodeo/sdk";
import { useEffect, useState } from "react";
import { isNull } from "lodash";
import { Link } from "@mui/material";
import Tippy from "@tippyjs/react";
import { ChevronRight } from "@mui/icons-material";
import { useLocalStorageState } from "ahooks";
import { ID } from "../../helper/variables.ts";

export const PartyStatblocks = () => {
    const currentParty = usePartyStore((state) => state.currentParty);
    const [obrParty, setObrParty] = useState<Player[]>([]);
    const [collapsed, setCollapsed] = useLocalStorageState<boolean>(`${ID}.party.members.collapsed`, {
        defaultValue: false,
    });

    useEffect(() => {
        const init = async () => {
            setObrParty(await OBR.party.getPlayers());
        };
        void init();
    }, []);

    if (isNull(currentParty)) {
        return <div>No party selected</div>;
    }

    if (currentParty.members.length === 0) {
        return (
            <div>
                Party currently has no members. Go to{" "}
                <Link href={"https://tabletop-almanac.com/party"}>Tabletop Almanac</Link> and update your party
            </div>
        );
    }

    return (
        <div>
            <div
                style={{
                    display: "flex",
                    gap: "1ch",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <h3>Members</h3>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ display: "flex", gap: "1ch", alignItems: "center" }}
                >
                    <ChevronRight sx={{ rotate: collapsed ? "0deg" : "90deg", transition: "all 0.25s ease" }} />
                </button>
            </div>
            {collapsed ? null : (
                <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "1ch", flexDirection: "column" }}>
                    {currentParty.members.map((member) => {
                        const player = obrParty.find((p) => p.id === member.playerId);

                        return (
                            <li
                                key={member.partyStatblockId}
                                style={{
                                    background: player?.color
                                        ? `linear-gradient(to right, ${player.color}, transparent 20px)`
                                        : "transparent",
                                    borderRadius: "8px",
                                    padding: "5px 24px",
                                    textAlign: "left",
                                    border: "1px solid white",
                                    display: "flex",
                                    gap: "1ch",
                                    alignItems: "center",
                                }}
                            >
                                {member.imageUrl ? (
                                    <Tippy content={"Click to unassign OBR Token from Party Member"}>
                                        <button
                                            style={{ border: "none", height: "45px", aspectRatio: "1/1" }}
                                            onClick={() => {
                                                partyStore.getState().updateMember({ ...member, imageUrl: undefined });
                                            }}
                                        >
                                            <img
                                                src={member.imageUrl}
                                                alt={member.statblock?.name}
                                                style={{ width: "45px", aspectRatio: "1/1" }}
                                            />
                                        </button>
                                    </Tippy>
                                ) : null}
                                <h4 style={{ margin: "1ch" }}>{member.statblock?.name}</h4>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};
