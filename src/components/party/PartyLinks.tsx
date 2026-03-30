import { usePartyStore } from "../../context/PartyStore.tsx";
import { useEffect, useState } from "react";
import { useGetParty } from "../../api/tabletop-almanac/useParty.ts";
import { ID } from "../../helper/variables.ts";
import { OpenInNew } from "@mui/icons-material";
import { Link, Tooltip } from "@mui/material";
import styles from "./party-inventory.module.scss";
import { PartyCollapse } from "./PartyCollapse.tsx";

export const PartyLinks = () => {
    const currentParty = usePartyStore((state) => state.currentParty);

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
