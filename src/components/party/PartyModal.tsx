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

export const PartyModal = () => {
    return (
        <ContextWrapper component={"party"}>
            <TokenContextWrapper>
                <Content />
            </TokenContextWrapper>
        </ContextWrapper>
    );
};

const Content = () => {
    const room = useMetadataContext.getState().room;
    const loginQuery = useGetLoggedIn(room?.tabletopAlmanacAPIKey);
    const [apiKey, setApiKey] = useState<string>(room?.tabletopAlmanacAPIKey || "");
    const debouncedApiKey = useDebounce(apiKey, { wait: 1000 });

    useEffect(() => {
        void updateRoomMetadata(room, { tabletopAlmanacAPIKey: debouncedApiKey });
    }, [debouncedApiKey]);

    const validKey = loginQuery.isSuccess ? loginQuery.data.logged_in : false;

    if (loginQuery.isLoading) {
        return <Loader />;
    }

    if (!room?.tabletopAlmanacAPIKey || !validKey) {
        return (
            <div>
                <h2>Party Settings</h2>
                <p>
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
                    {!validKey ? <div className={styles.error}>The entered key is invalid</div> : null}
                </p>
            </div>
        );
    }

    return (
        <div className={"party-modal"}>
            <div className={"party-modal-header"}>
                <h2>Party Settings</h2>
            </div>
            <PartySelect />
            <div className={"party-modal-content"}>
                <div className={"party-modal-content-header"}>
                    <h3>Party Members</h3>
                </div>
            </div>
        </div>
    );
};
