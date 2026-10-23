// R10a — shared logic for the "previous version" notice.
// Kept free of React so both the banner component and the background script
// (src/background/init.ts) can use it.

import { gmg4BannerClosedKey, gmg4BannerLaterKey } from "./variables.ts";

const HOUR_IN_MS = 60 * 60 * 1000;

// Format a config date (stored in UTC) as e.g. "9 November 2026".
export const formatGmg4Date = (date: Date): string =>
    date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
    });

// Headline shared by the banner and the session notification. This build is only reached by
// deliberately installing the old manifest, so it addresses GMs who chose to stay on 3.7.
export const gmg4Headline = (): string => "You are using the previous Game Master's Grimoire (3.7)";

// Whether the version-4 banner should currently be shown to the GM.
export const isGmg4BannerVisible = (now: number = Date.now()): boolean => {
    if (localStorage.getItem(gmg4BannerClosedKey)) return false;
    const laterUntil = Number(localStorage.getItem(gmg4BannerLaterKey) ?? 0);
    return !Number.isFinite(laterUntil) || now >= laterUntil;
};

// Hide the banner (and the session notification) for good on this device.
export const closeGmg4Banner = (): void => {
    localStorage.setItem(gmg4BannerClosedKey, "true");
};

// Postpone the banner for `hours` (default 24h).
export const snoozeGmg4Banner = (hours = 24, now: number = Date.now()): void => {
    localStorage.setItem(gmg4BannerLaterKey, String(now + hours * HOUR_IN_MS));
};
