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
import {
    VerifiedUser as EquippedIcon,
    GroupRounded,
    AutoAwesomeOutlined as UnattunedIcon,
    AutoAwesome as AttunedIcon,
} from "@mui/icons-material";
import RemoveModeratorIcon from "@mui/icons-material/RemoveModerator";
import { StatblockItems } from "../../helper/equipmentHelpers.ts";
import {
    useGetParty,
    useUpdatePartyInventory,
    useUpdatePartyStatblockEquipment,
} from "../../api/tabletop-almanac/useParty.ts";
import {
    autoUpdate,
    flip,
    FloatingPortal,
    offset,
    safePolygon,
    shift,
    useFloating,
    useHover,
    useInteractions,
} from "@floating-ui/react";
import { ItemHover } from "../gmgrimoire/items/ItemHover.tsx";

export const PlayerPartyStatblockItem = ({
    item,
    partyId,
    inventoryId,
    partyStatblockId,
    slug,
}: {
    item: StatblockItems;
    partyId: number;
    inventoryId: number;
    partyStatblockId: number;
    slug: string;
}) => {
    const updateStatblockEquipment = useUpdatePartyStatblockEquipment(partyId, partyStatblockId, item.id, slug);
    const updatePartyInventory = useUpdatePartyInventory(partyId, inventoryId);

    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles, context } = useFloating({
        open: isOpen,
        onOpenChange: setIsOpen,
        whileElementsMounted: autoUpdate,
        placement: "top",
        middleware: [offset(10), flip(), shift()],
    });

    const hover = useHover(context, {
        handleClose: safePolygon(),
        delay: { open: 200, close: 100 },
    });

    const { getReferenceProps, getFloatingProps } = useInteractions([hover]);

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                gap: "1ch",
                padding: "0.5ch 1ch",
                borderRadius: "8px",
                width: "100%",
                backgroundColor: "#2b2a33",
            }}
        >
            <div style={{ flexGrow: 1 }}>
                <span ref={refs.setReference} {...getReferenceProps()}>
                    {item.count} x {item.item.name}{" "}
                    <span style={{ fontStyle: "italic", fontSize: "0.8rem" }}>{item.item.rarity}</span>
                </span>
                <span style={{ display: "flex", alignItems: "center" }}>
                    {item.equipped ? (
                        <Tippy content={"is equipped"}>
                            <b>E</b>
                        </Tippy>
                    ) : null}
                    {item.attuned ? (
                        <Tippy content={"is attuned"}>
                            <b>A</b>
                        </Tippy>
                    ) : null}
                    {item.proficient ? (
                        <Tippy content={"is proficient"}>
                            <b>P</b>
                        </Tippy>
                    ) : null}
                    {item.item.cost ? (
                        <span style={{ marginLeft: "10px", fontSize: "0.8rem" }}>
                            {item.item.cost.pp ? `${item.item.cost?.pp}PP` : null}{" "}
                            {item.item.cost.gp ? `${item.item.cost?.gp}GP` : null}{" "}
                            {item.item.cost.ep ? `${item.item.cost?.ep}EP` : null}{" "}
                            {item.item.cost.sp ? `${item.item.cost?.sp}SP` : null}{" "}
                            {item.item.cost.cp ? `${item.item.cost?.cp}CP` : null}
                        </span>
                    ) : null}
                </span>
            </div>
            <div className={"buttons"} style={{ justifySelf: "flex-end", display: "flex", gap: "1ch" }}>
                {item.item.can_equip ? (
                    <Tippy content={`Toggle Equipped - Current: ${item.equipped ? "equipped" : "not equipped"}`}>
                        <button
                            className={"button"}
                            onClick={() => {
                                updateStatblockEquipment.mutateAsync({ equipped: !item.equipped });
                            }}
                            disabled={updateStatblockEquipment.isPending || updatePartyInventory.isPending}
                        >
                            {item.equipped ? <EquippedIcon /> : <RemoveModeratorIcon />}
                        </button>
                    </Tippy>
                ) : null}
                {item.item.requires_attuning ? (
                    <Tippy content={`Toggle Attunement - Current: ${item.attuned ? "attuned" : "not attuned"}`}>
                        <button
                            className={"button"}
                            onClick={() => {
                                updateStatblockEquipment.mutateAsync({ attuned: !item.attuned });
                            }}
                            disabled={updateStatblockEquipment.isPending || updatePartyInventory.isPending}
                        >
                            {item.attuned ? <AttunedIcon /> : <UnattunedIcon />}
                        </button>
                    </Tippy>
                ) : null}
                <Tippy content={"Move To Party Inventory"}>
                    <button
                        className={"delete button"}
                        disabled={updateStatblockEquipment.isPending || updatePartyInventory.isPending}
                        onClick={() => {
                            updatePartyInventory.mutateAsync({
                                new_items: [{ item_id: item.item.id, count: item.count ?? 0 }],
                            });
                            updateStatblockEquipment.mutateAsync({ remove: item.count });
                        }}
                    >
                        <GroupRounded />
                    </button>
                </Tippy>
            </div>
            {isOpen && (
                <FloatingPortal>
                    <div
                        ref={refs.setFloating}
                        style={{
                            ...floatingStyles,
                            backgroundColor: "#2b2a33dd",
                            border: "1px solid #ddd",
                            padding: "8px",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                            zIndex: 100,
                        }}
                        {...getFloatingProps()}
                    >
                        <ItemHover item={item.item} />
                    </div>
                </FloatingPortal>
            )}
        </div>
    );
};

export const PlayerPartyStatblockEquipment = ({ member }: { member: PartyStoreStatblock }) => {
    const currentParty = usePartyStore((state) => state.currentParty);
    const apiKey = useMetadataContext((state) => state.room?.tabletopAlmanacAPIKey);
    const statblockQuery = useE5GetStatblock(member.statblock?.slug ?? "", apiKey);

    const partyQuery = useGetParty(currentParty?.id ?? 0);
    const party = partyQuery.isSuccess ? partyQuery.data : undefined;
    const statblock = statblockQuery.isSuccess ? statblockQuery.data : undefined;

    if (statblockQuery.isLoading && partyQuery.isLoading) {
        return <Loader />;
    }

    if (!currentParty || !party || !party.inventory) {
        return <div>No Party or Party has no Inventory</div>;
    }

    return (
        <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1ch" }}>
            {statblock?.equipment
                ?.sort((a, b) => a.item.name.localeCompare(b.item.name))
                .map((item, index) => (
                    <PlayerPartyStatblockItem
                        item={item}
                        partyId={currentParty.id}
                        inventoryId={party.inventory?.id || 0}
                        partyStatblockId={member.partyStatblockId}
                        slug={statblock.slug ?? ""}
                        key={index}
                    />
                ))}
        </div>
    );
};

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
                flexDirection: "column",
            }}
        >
            <div
                style={{
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
            </div>
            <PartyCollapse
                storageKey={`${ID}.party.player.${member.partyStatblockId}.equipment.collapsed`}
                heading={"Equiment"}
            >
                <PlayerPartyStatblockEquipment member={member} />
            </PartyCollapse>
        </li>
    );
};

export const PlayerPartyStatblocks = () => {
    const members = usePartyStore((state) => state.currentParty?.members);

    return (
        <PartyCollapse storageKey={`${ID}.party.player.members.collapsed`} heading={"Statblocks"}>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "1ch", flexDirection: "column" }}>
                {members?.map((member) => {
                    return <PlayerPartyStatblock member={member} key={member.partyStatblockId} />;
                })}
            </ul>
        </PartyCollapse>
    );
};

export const PlayerParty = () => {
    return <PlayerPartyStatblocks />;
};
