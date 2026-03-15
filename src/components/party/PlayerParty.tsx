import { partyStore, PartyStoreStatblock, usePartyStore } from "../../context/PartyStore.tsx";
import { PartyCollapse } from "./PartyCollapse.tsx";
import { ID } from "../../helper/variables.ts";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import { useEffect, useState } from "react";
import OBR, { Player } from "@owlbear-rodeo/sdk";
import { useE5GetStatblock } from "../../api/e5/useE5Api.ts";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import Tippy from "@tippyjs/react";
import { Loader } from "../general/Loader.tsx";
import { PaidRounded, ScaleRounded } from "@mui/icons-material";
import styles from "./party-inventory.module.scss";

export const PlayerPartyStatblock = ({ member }: { member: PartyStoreStatblock }) => {
    const player = usePlayerContext();
    const [obrParty, setObrParty] = useState<Player[]>([]);
    const apiKey = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);
    const isOwner = player.id === member.playerId;

    const statblockQuery = useE5GetStatblock(isOwner ? (member.statblock?.slug ?? "") : "", apiKey);

    useEffect(() => {
        const init = async () => {
            setObrParty(await OBR.party.getPlayers());
        };
        void init();
    }, []);

    const statblockPlayer = obrParty.find((p) => p.id === member.playerId);
    const statblock = statblockQuery.isSuccess ? statblockQuery.data : undefined;

    const totalWeight =
        statblock?.equipment?.reduce((acc, eq) => acc + (eq.item.weight ?? 0) * (eq.count ?? 1), 0) ?? 0;

    const formatMoney = () => {
        if (!statblock?.money) return null;
        const { pp, gp, ep, sp, cp } = statblock.money;
        const parts = [];
        if (pp)
            parts.push(
                <span key="pp" className={`${styles.costItem} ${styles.pp}`}>
                    {pp}pp
                </span>,
            );
        if (gp)
            parts.push(
                <span key="gp" className={`${styles.costItem} ${styles.gp}`}>
                    {gp}gp
                </span>,
            );
        if (ep)
            parts.push(
                <span key="ep" className={`${styles.costItem} ${styles.ep}`}>
                    {ep}ep
                </span>,
            );
        if (sp)
            parts.push(
                <span key="sp" className={`${styles.costItem} ${styles.sp}`}>
                    {sp}sp
                </span>,
            );
        if (cp)
            parts.push(
                <span key="cp" className={`${styles.costItem} ${styles.cp}`}>
                    {cp}cp
                </span>,
            );

        if (parts.length === 0) {
            return (
                <span className={`${styles.costItem} ${styles.cp}`} style={{ opacity: 0.5 }}>
                    0cp
                </span>
            );
        }

        return <div style={{ display: "flex", gap: "0.5ch" }}>{parts}</div>;
    };

    if (!isOwner) {
        return (
            <li
                style={{
                    background: statblockPlayer?.color
                        ? `linear-gradient(to right, ${statblockPlayer.color}, transparent 20px)`
                        : "transparent",
                    borderRadius: "8px",
                    padding: "5px 24px",
                    textAlign: "left",
                    border: "1px solid white",
                    display: "flex",
                    gap: "1ch",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                }}
            >
                <div style={{ display: "flex", gap: "0.5ch", alignItems: "center" }}>
                    {member.imageUrl ? (
                        <img src={member.imageUrl} alt={member.statblock?.name} style={{ height: "43px" }} />
                    ) : null}
                    <h4 style={{ margin: "1ch", whiteSpace: "nowrap" }}>{member.statblock?.name}</h4>
                </div>
            </li>
        );
    }

    return (
        <li
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
                justifyContent: "space-between",
                flexWrap: "wrap",
            }}
        >
            <div style={{ display: "flex", gap: "0.5ch", alignItems: "center" }}>
                {member.imageUrl ? (
                    <Tippy content={"Click to unassign OBR Token from Party Member"}>
                        <button
                            style={{ border: "none", height: "45px", aspectRatio: "1/1" }}
                            onClick={() => {
                                partyStore.getState().updateMember({ ...member, imageUrl: undefined });
                            }}
                        >
                            <img src={member.imageUrl} alt={member.statblock?.name} style={{ height: "43px" }} />
                        </button>
                    </Tippy>
                ) : null}
                <h4 style={{ margin: "1ch", whiteSpace: "nowrap" }}>{member.statblock?.name}</h4>
            </div>
            <div
                style={{
                    display: "flex",
                    gap: "3ch",
                    alignItems: "center",
                    fontSize: "0.8em",
                    opacity: 0.9,
                    marginLeft: "auto",
                    justifyContent: "flex-end",
                }}
            >
                {statblockQuery.isLoading ? (
                    <Loader />
                ) : statblock ? (
                    <>
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.5ch",
                                color: "rgba(255, 255, 255, 0.7)",
                            }}
                        >
                            <ScaleRounded sx={{ fontSize: "1.2em", opacity: 0.6 }} />
                            <span>{totalWeight.toFixed(1)}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.8ch" }}>
                            <PaidRounded sx={{ fontSize: "1.2em", opacity: 0.6 }} />
                            {formatMoney()}
                        </div>
                    </>
                ) : null}
            </div>
        </li>
    );
};

export const PlayerPartyStatblocks = () => {
    const currentParty = usePartyStore((state) => state.currentParty);

    return (
        <PartyCollapse storageKey={`${ID}.party.player.members.collapsed`} heading={"Statblocks"}>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "1ch", flexDirection: "column" }}>
                {currentParty?.members?.map((member) => {
                    return <PlayerPartyStatblock member={member} key={member.partyStatblockId} />;
                })}
            </ul>
        </PartyCollapse>
    );
};

export const PlayerParty = () => {
    return <PlayerPartyStatblocks />;
};
