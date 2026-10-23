import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useMetadataContext } from "../../../context/MetadataContext.ts";
import {
    ALMANAC_URL,
    CUTOVER_DATE,
    GMG4_TUTORIAL_URL,
    GMP_MANIFEST_URL,
    NEW_ALMANAC_URL,
    OLD_GMG_URL,
} from "../../../config.ts";
import Tippy from "@tippyjs/react";
import {
    closeGmg4Banner,
    formatGmg4Date,
    gmg4Headline,
    isGmg4BannerVisible,
    snoozeGmg4Banner,
} from "../../../helper/gmg4.ts";
import styles from "./gmg4-banner.module.scss";

const CopyField = ({ url }: { url: string }) => {
    const [copied, setCopied] = useState(false);

    return (
        <div className={styles.copyField}>
            <input type={"text"} readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
            <button
                type={"button"}
                className={styles.copyButton}
                onClick={async () => {
                    try {
                        await navigator.clipboard.writeText(url);
                        setCopied(true);
                        window.setTimeout(() => setCopied(false), 1500);
                    } catch {
                        // Clipboard may be unavailable - the field is pre-selected so the GM can copy manually.
                    }
                }}
            >
                {copied ? "Copied" : "Copy"}
            </button>
        </div>
    );
};

export const Gmg4Banner = () => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const [visible, setVisible] = useState<boolean>(() => isGmg4BannerVisible());

    const isPathfinder = room?.ruleset === "pf";

    const oldAlmanacHost = useMemo(() => {
        try {
            return new URL(ALMANAC_URL).host;
        } catch {
            return ALMANAC_URL;
        }
    }, []);

    const cutover = formatGmg4Date(CUTOVER_DATE);

    if (!visible) return null;

    return (
        <div className={styles.banner}>
            <div className={styles.header}>
                <h2 className={styles.heading}>{gmg4Headline()}</h2>
                <div className={styles.actions}>
                    <Tippy content={"Show this again in 24 hours"}>
                        <button
                            type={"button"}
                            className={styles.later}
                            onClick={() => {
                                snoozeGmg4Banner();
                                setVisible(false);
                            }}
                        >
                            Later
                        </button>
                    </Tippy>
                    <Tippy content={"Close and don't show this again"}>
                        <button
                            type={"button"}
                            className={styles.later}
                            aria-label={"Close and don't show this again"}
                            onClick={() => {
                                closeGmg4Banner();
                                setVisible(false);
                            }}
                        >
                            &#x2715;
                        </button>
                    </Tippy>
                </div>
            </div>
            <p>
                This is the old version of Game Master's Grimoire, kept at{" "}
                <a href={OLD_GMG_URL} target={"_blank"} rel={"noreferrer"}>
                    {OLD_GMG_URL}
                </a>{" "}
                for GMs who want to stay on it. It keeps running for as long as it works, but it no longer receives
                updates or support and may stop working at any time.
            </p>
            <p>
                It uses the previous Tabletop Almanac at{" "}
                <a href={ALMANAC_URL} target={"_blank"} rel={"noreferrer"}>
                    {oldAlmanacHost}
                </a>
                , a frozen copy from {cutover}. Creatures, parties and settings you change here are no longer carried
                over to the new Tabletop Almanac.
            </p>
            <div className={styles.step}>
                <strong>Switching to Game Master's Grimoire 4</strong>
                <ol>
                    <li>In Owlbear Rodeo open Extensions</li>
                    <li>Remove the Current Game Master's Grimoire extension</li>
                    <li>Install the Game Master's Grimoire directly from the Owlbear Rodeo Extension Store.</li>
                </ol>
                <p>Your tokens, groups and initiative move automatically the first time Grimoire 4.0 opens the room.</p>
            </div>
            {isPathfinder ? (
                <div className={styles.step}>
                    <span>
                        <strong>Pathfinder tables:</strong> install Game Master's Pathfinder instead.
                    </span>
                    <CopyField url={GMP_MANIFEST_URL} />
                </div>
            ) : null}
            <p>
                Your account and everything you created before {cutover} are already on the new Tabletop Almanac; sign
                in at{" "}
                <a href={NEW_ALMANAC_URL} target={"_blank"} rel={"noreferrer"}>
                    {NEW_ALMANAC_URL}
                </a>{" "}
                with the same credentials.{" "}
                <a href={GMG4_TUTORIAL_URL} target={"_blank"} rel={"noreferrer"}>
                    Watch the Grimoire 4 tutorial
                </a>
                .
            </p>
        </div>
    );
};
