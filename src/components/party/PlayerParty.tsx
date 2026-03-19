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
import { CurrencyExchangeRounded, ScaleRounded } from "@mui/icons-material";
import styles from "./party-inventory.module.scss";
import {
    VerifiedUser as EquippedIcon,
    GroupRounded,
    AutoAwesomeOutlined as UnattunedIcon,
    AutoAwesome as AttunedIcon,
    CheckRounded,
    CloseRounded,
} from "@mui/icons-material";
import RemoveModeratorIcon from "@mui/icons-material/RemoveModerator";
import { handleEquipmentChange, StatblockItems } from "../../helper/equipmentHelpers.ts";
import {
    E5StatblockOut,
    MoneyIn,
    PartyOut,
    useGetParty,
    useUpdatePartyInventory,
    useUpdatePartyMoney,
    useUpdatePartyStatblockEquipment,
    useUpdatePlayerStatblock,
    convertE5StatblockOutToStatblockIn,
    useGetPartyInventory,
    PartyInventoryOut,
    PartyItemOut,
    PartyStatblockOut,
    useAddPartyStatblockEquipment,
    StatblockItemIn,
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
import { useTokenListContext } from "../../context/TokenContext.tsx";
import { E5Statblock } from "../../api/e5/useE5Api.ts";
import { useForm } from "react-hook-form";
import { PartyInventoryItems, sortInventory } from "./PartyInventory.tsx";
import { EditButton } from "../form/EditButton.tsx";
import { NumberInput, SelectInput } from "../form/RHFInputs.tsx";
import { SubmitButton } from "../form/SubmitButton.tsx";

export type Money = {
    cp: number;
    sp: number;
    ep: number;
    gp: number;
    pp: number;
};

const formatMoney = (money?: Money) => {
    if (!money) {
        return null;
    }
    const { pp, gp, ep, sp, cp } = money;
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

export const EditPlayerStatblockMoney = ({
    statblock,
    party,
    setEdit,
}: {
    statblock: E5Statblock;
    party: PartyOut;
    setEdit: (edit: boolean) => void;
}) => {
    const updateMoney = useUpdatePartyMoney(party.id, party.money?.id ?? 0);
    const updateStatblock = useUpdatePlayerStatblock(statblock.id ?? "", statblock.slug ?? "");

    const maxValues: Money = {
        cp: (party.money?.cp ?? 0) + (statblock?.money?.cp ?? 0),
        sp: (party.money?.sp ?? 0) + (statblock?.money?.sp ?? 0),
        ep: (party.money?.ep ?? 0) + (statblock?.money?.ep ?? 0),
        gp: (party.money?.gp ?? 0) + (statblock?.money?.gp ?? 0),
        pp: (party.money?.pp ?? 0) + (statblock?.money?.pp ?? 0),
    };

    const form = useForm<MoneyIn>({
        defaultValues: {
            cp: statblock?.money?.cp ?? 0,
            sp: statblock?.money?.sp ?? 0,
            ep: statblock?.money?.ep ?? 0,
            gp: statblock?.money?.gp ?? 0,
            pp: statblock?.money?.pp ?? 0,
        },
    });
    const {
        register,
        watch,
        formState: { isSubmitting },
    } = form;
    const watchedValues = watch();

    const onSubmit = async (data: MoneyIn) => {
        try {
            const partyMoney = {
                cp: Math.min(Math.max(maxValues.cp - (data.cp ?? 0), 0), maxValues.cp),
                sp: Math.min(Math.max(maxValues.sp - (data.sp ?? 0), 0), maxValues.sp),
                ep: Math.min(Math.max(maxValues.ep - (data.ep ?? 0), 0), maxValues.ep),
                gp: Math.min(Math.max(maxValues.gp - (data.gp ?? 0), 0), maxValues.gp),
                pp: Math.min(Math.max(maxValues.pp - (data.pp ?? 0), 0), maxValues.pp),
            };

            const statblockUpdate = convertE5StatblockOutToStatblockIn(statblock);

            const statblockMoney: Money = {
                cp: Math.min(Math.max(maxValues.cp - partyMoney.cp, 0), maxValues.cp),
                sp: Math.min(Math.max(maxValues.sp - partyMoney.sp, 0), maxValues.sp),
                ep: Math.min(Math.max(maxValues.ep - partyMoney.ep, 0), maxValues.ep),
                gp: Math.min(Math.max(maxValues.gp - partyMoney.gp, 0), maxValues.gp),
                pp: Math.min(Math.max(maxValues.pp - partyMoney.pp, 0), maxValues.pp),
            };

            await updateMoney.mutateAsync(partyMoney);
            await updateStatblock.mutateAsync({
                ...statblockUpdate,
                money: statblockMoney,
            });

            setEdit(false);
        } catch (e) {}
    };

    const getChanges = () => {
        const changes: Partial<Money> = {};
        let hasGains = false;
        let hasLosses = false;

        (["pp", "gp", "ep", "sp", "cp"] as const).forEach((currency) => {
            const current = statblock?.money?.[currency] ?? 0;
            const target = watchedValues[currency] ?? 0;
            const diff = target - current;
            if (diff !== 0) {
                changes[currency] = diff;
                if (diff > 0) hasGains = true;
                if (diff < 0) hasLosses = true;
            }
        });

        if (Object.keys(changes).length === 0) return null;

        const formatChange = (c: Partial<Money>) => {
            return (["pp", "gp", "ep", "sp", "cp"] as const)
                .filter((curr) => c[curr] !== undefined && c[curr] !== 0)
                .map((curr) => (
                    <span key={curr} className={`${styles.costItem} ${styles[curr]}`}>
                        {Math.abs(c[curr]!)}
                        {curr}
                    </span>
                ));
        };

        if (hasGains && !hasLosses) {
            return <div className={styles.moneyChangeMessage}>You will receive {formatChange(changes)}</div>;
        }

        if (!hasGains && hasLosses) {
            return (
                <div className={styles.moneyChangeMessage}>
                    {formatChange(changes)} will be moved to the party inventory
                </div>
            );
        }

        const gains: Partial<Money> = {};
        const losses: Partial<Money> = {};
        (Object.keys(changes) as (keyof Money)[]).forEach((curr) => {
            if (changes[curr]! > 0) gains[curr] = changes[curr];
            else losses[curr] = changes[curr];
        });

        return (
            <div className={styles.moneyChangeMessage} style={{ flexDirection: "column", alignItems: "flex-end" }}>
                {Object.keys(gains).length > 0 && (
                    <div style={{ display: "flex", gap: "0.5ch", alignItems: "center" }}>
                        Receive {formatChange(gains)}
                    </div>
                )}
                {Object.keys(losses).length > 0 && (
                    <div style={{ display: "flex", gap: "0.5ch", alignItems: "center" }}>
                        Move {formatChange(losses)} to party
                    </div>
                )}
            </div>
        );
    };

    return (
        <form onSubmit={form.handleSubmit(onSubmit)} className={styles.moneyEditForm}>
            <div className={styles.moneyInputList}>
                {(["pp", "gp", "ep", "sp", "cp"] as const).map((currency) => (
                    <div key={currency} className={styles.moneyInput}>
                        <label className={styles[currency]}>{currency}</label>
                        <Tippy content={`Max available: ${maxValues[currency]}`}>
                            <input
                                type="number"
                                min={0}
                                max={maxValues[currency]}
                                {...register(currency, {
                                    valueAsNumber: true,
                                    max: maxValues[currency],
                                    min: 0,
                                })}
                            />
                        </Tippy>
                    </div>
                ))}
            </div>
            <div className={styles.formActions}>
                {getChanges()}
                <div style={{ display: "flex", gap: "1ch" }}>
                    <button
                        type="submit"
                        className={`${styles.actionButton} ${styles.confirm}`}
                        disabled={updateMoney.isPending || updateStatblock.isPending || isSubmitting}
                    >
                        <CheckRounded />
                    </button>
                    <button
                        type="button"
                        className={`${styles.actionButton} ${styles.cancel}`}
                        onClick={() => setEdit(false)}
                        disabled={updateMoney.isPending || updateStatblock.isPending || isSubmitting}
                    >
                        <CloseRounded />
                    </button>
                </div>
            </div>
        </form>
    );
};

export const PlayerStatblockMoney = ({ statblock, party }: { statblock: E5StatblockOut; party: PartyOut }) => {
    const [edit, setEdit] = useState<boolean>(false);

    const money = statblock.money;

    return (
        <div className={styles.moneyContainer}>
            {money ? (
                <>
                    {edit ? (
                        <EditPlayerStatblockMoney statblock={statblock} party={party} setEdit={setEdit} />
                    ) : (
                        <>
                            <div
                                className={styles.moneyDisplay}
                                style={{ background: "rgba(0, 0, 0, 0.2)", padding: "1.2ch", borderRadius: "8px" }}
                            >
                                {formatMoney(money)}
                            </div>
                            <Tippy content={"Edit Money"}>
                                <button
                                    className={styles.editButton}
                                    style={{ alignSelf: "center" }}
                                    onClick={() => {
                                        setEdit(!edit);
                                    }}
                                >
                                    <CurrencyExchangeRounded />
                                </button>
                            </Tippy>
                        </>
                    )}
                </>
            ) : (
                "Statblock has no money"
            )}
        </div>
    );
};

export const PlayerPartyStatblockItem = ({
    item,
    partyId,
    inventoryId,
    slug,
    statblock,
    member,
}: {
    item: StatblockItems;
    partyId: number;
    inventoryId: number;
    slug: string;
    member: PartyStoreStatblock;
    statblock: E5Statblock;
}) => {
    const updateStatblockEquipment = useUpdatePartyStatblockEquipment(partyId, member.partyStatblockId, item.id, slug);
    const updatePartyInventory = useUpdatePartyInventory(partyId, inventoryId);
    const tokens = useTokenListContext((state) => state.tokens);

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

    const onEquipmentChange = async (equipped: boolean, attuned: boolean) => {
        const token = [...(tokens?.values() ?? [])].find(
            (t) =>
                t.item.createdUserId === member.playerId &&
                t.item.image.url === member.imageUrl &&
                t.data.sheet === member.statblock?.slug,
        );
        if (token && statblock) {
            const equippedSlugs = [...(token.data.equipment?.equipped || [])];
            const attunedSlugs = [...(token.data.equipment?.attuned || [])];

            const itemIndexEquipped = equippedSlugs.findIndex((s) => s === item.item.slug);
            if (equipped && itemIndexEquipped === -1) {
                equippedSlugs.push(item.item.slug);
            } else if (!equipped && itemIndexEquipped !== -1) {
                equippedSlugs.splice(itemIndexEquipped, 1);
            }

            const itemIndexAttuned = attunedSlugs.findIndex((s) => s === item.item.slug);
            if (attuned && itemIndexAttuned === -1) {
                attunedSlugs.push(item.item.slug);
            } else if (!attuned && itemIndexAttuned !== -1) {
                attunedSlugs.splice(itemIndexAttuned, 1);
            }

            await handleEquipmentChange(token.data, equippedSlugs, attunedSlugs, statblock, token.item);
        }
    };

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
                            onClick={async () => {
                                await updateStatblockEquipment.mutateAsync({ equipped: !item.equipped });
                                await onEquipmentChange(!item.equipped, item.attuned);
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
                            onClick={async () => {
                                await updateStatblockEquipment.mutateAsync({ attuned: !item.attuned });
                                await onEquipmentChange(item.equipped, !item.attuned);
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
                        onClick={async () => {
                            await updatePartyInventory.mutateAsync({
                                new_items: [{ item_id: item.item.id, count: item.count ?? 0 }],
                            });
                            await updateStatblockEquipment.mutateAsync({ remove: item.count });
                            await onEquipmentChange(false, false);
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
                        slug={statblock.slug ?? ""}
                        statblock={statblock}
                        member={member}
                        key={index}
                    />
                ))}
        </div>
    );
};

export const PlayerPartyStatblock = ({ member, party }: { member: PartyStoreStatblock; party: PartyOut }) => {
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

    if (statblockQuery.isLoading) {
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
                <Loader />
            </li>
        );
    }

    if (!isOwner || !statblock) {
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
                        </>
                    ) : null}
                </div>
            </div>
            <PartyCollapse
                storageKey={`${ID}.party.player.${member.partyStatblockId}.money.collapsed`}
                heading={"Money"}
            >
                <PlayerStatblockMoney statblock={statblock} party={party} />
            </PartyCollapse>
            <PartyCollapse
                storageKey={`${ID}.party.player.${member.partyStatblockId}.equipment.collapsed`}
                heading={"Equiment"}
            >
                <PlayerPartyStatblockEquipment member={member} />
            </PartyCollapse>
        </li>
    );
};

export const PlayerPartyStatblocks = ({ party }: { party: PartyOut }) => {
    const members = usePartyStore((state) => state.currentParty?.members);

    return (
        <PartyCollapse storageKey={`${ID}.party.player.members.collapsed`} heading={"Statblocks"}>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "1ch", flexDirection: "column" }}>
                {members?.map((member) => {
                    return <PlayerPartyStatblock member={member} party={party} key={member.partyStatblockId} />;
                })}
            </ul>
        </PartyCollapse>
    );
};

export const PlayerPartyMoney = ({ party }: { party: PartyOut }) => {
    return (
        <PartyCollapse storageKey={`${ID}.party.player.money.collapsed`} heading={"Party Money"}>
            <div
                className={styles.moneyContainer}
                style={{ background: "rgba(0, 0, 0, 0.2)", padding: "1.2ch", borderRadius: "8px" }}
            >
                <div className={styles.moneyDisplay} style={{ justifyContent: "center", fontSize: "1rem" }}>
                    {formatMoney(party.money ?? undefined)}
                </div>
            </div>
        </PartyCollapse>
    );
};

const EditPlayerPartyInventoryItem = ({
    item,
    partyId,
    setEditItem,
    inventoryId,
}: {
    item: PartyItemOut;
    partyId: number;
    setEditItem: (state: boolean) => void;
    inventoryId: number;
}) => {
    const addPartyStatblockEquipment = useAddPartyStatblockEquipment(partyId);
    const updatePartyInventory = useUpdatePartyInventory(partyId, inventoryId);
    const player = usePlayerContext();
    const members = usePartyStore((state) => state.currentParty?.members);

    const availableStatblocks =
        members?.filter((member) => {
            return member.playerId === player.id;
        }) ?? [];

    const form = useForm<{ data: StatblockItemIn; partyStatblockId: number }>({
        defaultValues: {
            data: {
                equipped: item.item.can_equip,
                attuned: item.item.requires_attuning,
                proficient: true,
                item: item.item.id,
                count: item.count,
            },
            partyStatblockId:
                availableStatblocks && availableStatblocks.length > 0
                    ? availableStatblocks[0].partyStatblockId
                    : undefined,
        },
    });

    const handleSubmit = async (data: { data: StatblockItemIn; partyStatblockId: number }) => {
        try {
            await updatePartyInventory.mutateAsync({
                item_updates: [{ remove: data.data.count, item_id: item.item.id }],
            });
            await addPartyStatblockEquipment.mutateAsync(data);
            setEditItem(false);
        } catch (e) {
            console.error(e);
        }
        setEditItem(false);
    };

    return availableStatblocks.length > 0 && item.count > 0 ? (
        <form onSubmit={form.handleSubmit(handleSubmit)} className={partyStyles.editItemCount}>
            <NumberInput
                form={form}
                fieldName={"data.count"}
                label={"Count"}
                required={true}
                min={0}
                max={item.count}
            />
            <SelectInput
                form={form}
                fieldName={"partyStatblockId"}
                label={"Statblock"}
                required={true}
                className={partyStyles.wideSelect}
                options={availableStatblocks.map((s) => {
                    // @ts-ignore we test above that statblock is not null
                    return { key: s.id.toString(), value: s.statblock.name };
                })}
            />
            <button
                className={"button delete"}
                type={"button"}
                onClick={() => setEditItem(false)}
                style={{ marginTop: "10px" }}
            >
                Cancel
            </button>
            <SubmitButton
                form={form}
                pending={addPartyStatblockEquipment.isPending || updatePartyInventory.isPending}
            />
        </form>
    ) : (
        <button
            className={"button delete"}
            type={"button"}
            onClick={() => setEditItem(false)}
            style={{ marginTop: "10px" }}
        >
            {availableStatblocks.length === 0 ? "No Available Statblocks: Cancel" : "No Items available: Cancel"}
        </button>
    );
};

export const PlayerPartyInventoryItem = ({
    item,
    partyId,
    inventoryId,
    statblocks,
}: {
    item: PartyItemOut;
    partyId: number;
    inventoryId: number;
    statblocks: PartyStatblockOut[];
}) => {
    const [editItem, setEditItem] = useState<boolean>(false);

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
        <div className={partyStyles.partyInventoryItem}>
            <span>
                {`${item.count} x `}
                <b ref={refs.setReference} {...getReferenceProps()}>
                    {item.item.name}
                </b>
                , <span style={{ fontStyle: "italic", fontSize: "0.8rem" }}>{item.item.rarity}</span>
                {item.item.cost ? (
                    <span style={{ marginLeft: "10px", fontSize: "0.8rem" }}>
                        {item.item.cost.pp ? `${item.item.cost?.pp}PP` : null}{" "}
                        {item.item.cost.gp ? `${item.item.cost?.gp}GP` : null}{" "}
                        {item.item.cost.ep ? `${item.item.cost?.ep}EP` : null}{" "}
                        {item.item.cost.sp ? `${item.item.cost?.sp}SP` : null}{" "}
                        {item.item.cost.cp ? `${item.item.cost?.cp}CP` : null}
                    </span>
                ) : null}
                {editItem ? (
                    <EditPlayerPartyInventoryItem
                        item={item}
                        partyId={partyId}
                        statblocks={statblocks}
                        inventoryId={inventoryId}
                        setEditItem={setEditItem}
                    />
                ) : null}
            </span>
            <span></span>
            <EditButton onClick={() => setEditItem(!editItem)} alignCenter={true} />
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

export const PlayerPartyInventoryItems = ({ party }: { party: PartyOut }) => {
    const inventoryQuery = useGetPartyInventory(party.id, party.inventory?.id ?? 0);
    const [sort, setSort] = useState<"name" | "rarity">("name");

    if (inventoryQuery.isLoading) {
        return <Loader />;
    }

    const inventory = inventoryQuery.data as PartyInventoryOut;

    if (inventory?.items?.length === 0) {
        return <div>No items in inventory</div>;
    }

    return (
        <div>
            <select
                style={{ width: "200px" }}
                onChange={(e) => setSort(e.target.value as "name" | "rarity")}
                value={sort}
            >
                <option value={"name"}>Sort by name</option>
                <option value={"rarity"}>Sort by rarity</option>
            </select>
            {inventory?.items
                ?.sort((a, b) => sortInventory(a, b, sort))
                .map((item) => {
                    return (
                        <PlayerPartyInventoryItem
                            key={item.id}
                            item={item}
                            partyId={party.id}
                            statblocks={party.statblocks ?? []}
                            inventoryId={party.inventory?.id ?? 0}
                        />
                    );
                })}
        </div>
    );
};

export const PlayerPartyInventory = ({ party }: { party: PartyOut }) => {
    return (
        <PartyCollapse storageKey={`${ID}.party.player.money.collapsed`} heading={"Party Inventory"}>
            <div
                className={styles.moneyContainer}
                style={{ background: "rgba(0, 0, 0, 0.2)", padding: "1.2ch", borderRadius: "8px" }}
            >
                <PlayerPartyInventoryItems party={party} />
            </div>
        </PartyCollapse>
    );
};

export const PlayerParty = () => {
    const currentParty = usePartyStore((state) => state.currentParty);
    const partyQuery = useGetParty(currentParty?.id ?? 0);

    const party = partyQuery.isSuccess ? partyQuery.data : undefined;

    if (partyQuery.isLoading) {
        return <Loader />;
    }

    if (!currentParty || !party) {
        return <div>Issues loading Party</div>;
    }

    return (
        <>
            <PlayerPartyStatblocks party={party} />
            <PlayerPartyMoney party={party} />
            <PlayerPartyInventory party={party} />
        </>
    );
};
