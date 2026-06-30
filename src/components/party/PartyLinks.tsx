import { usePartyStore } from "../../context/PartyStore.tsx";
import { useEffect, useState } from "react";
import { useGetParty } from "../../api/tabletop-almanac/useParty.ts";
import { ID } from "../../helper/variables.ts";
import { OpenInNew } from "@mui/icons-material";
import { Link, Tooltip } from "@mui/material";
import styles from "./party-inventory.module.scss";
import { PartyCollapse } from "./PartyCollapse.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";

export const PartyLinks = () => {
    const activePartyId = useMetadataContext((state) => state.room?.partyId);
    const currentParty = usePartyStore((state) => {
        if (!activePartyId) return null;
        return state.parties.find((p) => p.id === activePartyId) ?? null;
    });

    const [partyId, setPartyId] = useState<number | undefined>(currentParty?.id);

    const partyQuery = useGetParty(partyId);

    const party = partyQuery.isSuccess ? partyQuery.data : undefined;

    useEffect(() => {
        if (currentParty) {
            setPartyId(currentParty.id);
        }
    }, [currentParty]);

    return (
        <PartyCollapse storageKey={`${ID}.party.links.collapsed`} heading="Links">
            <ul className={styles.partyLinks}>
                {party?.links?.map((link, index) => {
                    return (
                        <li key={index}>
                            <OpenInNew />
                            <Tooltip title={link} arrow placement={"top-start"}>
                                <Link href={link} target={"_blank"} underline={"hover"}>
                                    {link}
                                </Link>
                            </Tooltip>
                        </li>
                    );
                })}
            </ul>
        </PartyCollapse>
    );
};
