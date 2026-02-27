import { useListParties } from "../../api/tabletop-almanac/useParty.ts";
import { Loader } from "../general/Loader.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { Link } from "@mui/material";
import { useEffect, useState } from "react";
import { useDebounce } from "ahooks";
import { updateRoomMetadata } from "../../helper/helpers.ts";

export const PartySelect = () => {
    const room = useMetadataContext.getState().room;
    const [partyId, setPartyId] = useState<number | undefined>(room?.partyId);
    const debouncedPartyId = useDebounce(partyId, { wait: 500 });
    const partyQuery = useListParties({ limit: 100, offset: 0 });

    useEffect(() => {
        void updateRoomMetadata(room, { partyId: debouncedPartyId });
    }, [debouncedPartyId]);

    const parties = partyQuery.isSuccess ? partyQuery.data?.page : [];

    if (partyQuery.isLoading) {
        return (
            <div>
                Loading your parties
                <Loader />
            </div>
        );
    }

    if (parties.length === 0) {
        return (
            <div>
                You have no parties yet. Create one in the{" "}
                <Link href={"https://tabletop-almanac.com/party"} target={"_blank"}>
                    Tabletop Almanac
                </Link>
                .
            </div>
        );
    }

    return (
        <div>
            Select a party for this Owlbear Rodeo Room:
            <select
                value={partyId}
                onSelect={(e) => {
                    setPartyId(Number(e));
                }}
            >
                {parties?.map((party) => {
                    return (
                        <option key={party.id} value={party.id}>
                            {party.name}
                        </option>
                    );
                })}
            </select>
        </div>
    );
};
