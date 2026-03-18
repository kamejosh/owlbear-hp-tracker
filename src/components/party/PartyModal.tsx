import { ContextWrapper } from "../ContextWrapper.tsx";
import { TokenContextWrapper } from "../TokenContextWrapper.tsx";
import { useMetadataContext } from "../../context/MetadataContext.ts";
import { Link } from "@mui/material";
import { updateRoomMetadata } from "../../helper/helpers.ts";
import { useGetLoggedIn } from "../../api/tabletop-almanac/useUser.ts";
import { Loader } from "../general/Loader.tsx";
import { useDebounce } from "ahooks";
import { useEffect, useState } from "react";
import styles from "./party.module.css";
import { PartySelect } from "./PartySelect.tsx";
import { PartyStatblocks } from "./PartyStatblocks.tsx";
import { usePartyStore } from "../../context/PartyStore.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import { PartyInventory } from "./PartyInventory.tsx";
import { PartyMoney } from "./PartyMoney.tsx";
import { PartyLinks } from "./PartyLinks.tsx";
import { PlayerParty } from "./PlayerParty.tsx";

export const PartyModal = () => {
    return (
        <ContextWrapper component={"party"}>
            <TokenContextWrapper>
                <div className={"party-modal"}>
                    <Content />
                </div>
            </TokenContextWrapper>
        </ContextWrapper>
    );
};

const Content = () => {
    const player = usePlayerContext();

    if (player.role === "GM") {
        return <GMContent />;
    }
    return <PlayerContent />;
};

const GMContent = () => {
    const room = useMetadataContext((state) => state.room);
    const currentParty = usePartyStore((state) => state.currentParty);
    const loginQuery = useGetLoggedIn(room?.tabletopAlmanacAPIKey);
    const [apiKey, setApiKey] = useState<string>(room?.tabletopAlmanacAPIKey || "");
    const debouncedApiKey = useDebounce(apiKey, { wait: 1000 });

    useEffect(() => {
        void updateRoomMetadata(room, { tabletopAlmanacAPIKey: debouncedApiKey });
    }, [debouncedApiKey]);

    const validKey = loginQuery.isSuccess ? loginQuery.data.logged_in : false;

    if (!room?.tabletopAlmanacAPIKey || !validKey) {
        return (
            <div>
                <h2>Party Settings</h2>
                <div>
                    To use the party feature enter your{" "}
                    <Link href={"https://tabletop-almanac.com"}>Tabletop Almanac</Link> API Key:
                    <input
                        className={`masked-input ${validKey ? "valid" : styles.invalid}`}
                        type={"text"}
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                        }}
                    />
                    {loginQuery.isLoading ? (
                        <Loader />
                    ) : !validKey ? (
                        <div className={styles.error}>The entered key is invalid</div>
                    ) : null}
                </div>
            </div>
        );
    }

    return (
        <div className={styles.partyModal}>
            <PartySelect />

            {currentParty ? (
                <div className={styles.partyModalContent}>
                    <h2 style={{ marginBottom: "0.5rem" }}>{currentParty?.name}</h2>
                    <PartyStatblocks />
                    <PartyInventory />
                    <PartyMoney />
                    <PartyLinks />
                </div>
            ) : (
                <div className={styles.partyModalContent}>No party selected</div>
            )}
        </div>
    );
};

const PlayerContent = () => {
    const currentParty = usePartyStore((state) => state.currentParty);

    if (!currentParty) {
        return <div>No party selected</div>;
    }

    return (
        <div className={styles.partyModal}>
            <div className={styles.partyModalContent}>
                <h2 style={{ marginBottom: "0.5rem" }}>{currentParty?.name}</h2>
                <PlayerParty />
            </div>
        </div>
    );
};
