import { usePartyStore } from "../../context/PartyStore.tsx";
import { isNull } from "lodash";
import { Link } from "@mui/material";
import { ID } from "../../helper/variables.ts";
import { Loader } from "../general/Loader.tsx";

import { PartyCollapse } from "./PartyCollapse.tsx";
import { PlayerPartyStatblock } from "./PlayerParty.tsx";
import { useGetParty } from "../../api/tabletop-almanac/useParty.ts";

export const PartyStatblocks = () => {
    const currentParty = usePartyStore((state) => state.currentParty);
    const partyQuery = useGetParty(currentParty?.id ?? 0);

    const party = partyQuery.isSuccess ? partyQuery.data : undefined;

    if (partyQuery.isLoading) {
        return <Loader />;
    }

    if (isNull(currentParty) || !party) {
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
        <PartyCollapse storageKey={`${ID}.party.members.collapsed`} heading="Members">
            <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "1ch", flexDirection: "column" }}>
                {currentParty.members.map((member) => {
                    return <PlayerPartyStatblock member={member} party={party} key={member.partyStatblockId} />;
                })}
            </ul>
        </PartyCollapse>
    );
};
