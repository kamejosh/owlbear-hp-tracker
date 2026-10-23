// R10a — configuration for the legacy Grimoire 3.7 build.
//
// One build-time switch: VITE_LEGACY_BUILD=true turns this tree into the legacy build that runs at
// old.gmg.tabletop-almanac.com after the cutover (links to the previous Tabletop Almanac, the
// "previous version" banner). Unset, it builds exactly what ran before: the current Tabletop
// Almanac and the one-time "GM's Grimoire 4.0 is coming" modal. Set it only on the old.gmg deployment.
export const LEGACY_BUILD = import.meta.env.VITE_LEGACY_BUILD === "true";

// The Tabletop Almanac API this build talks to (api.old.tabletop-almanac.com in the legacy build).
export const TTRPG_URL = import.meta.env.VITE_TTRPG_URL;

// The new stack that takes over on the cutover day.
export const NEW_ALMANAC_URL = "https://tabletop-almanac.com";
export const GMG_MANIFEST_URL = "https://gmg.tabletop-almanac.com/manifest.json";
export const GMP_MANIFEST_URL = "https://gmp.tabletop-almanac.com/manifest.json";

// The Tabletop Almanac website all in-app links point to: the previous site (whose accounts, API keys
// and parties the old API can see) in the legacy build, the current one otherwise.
export const ALMANAC_URL: string =
    import.meta.env.VITE_ALMANAC_URL || (LEGACY_BUILD ? "https://old.tabletop-almanac.com" : NEW_ALMANAC_URL);

// Where the legacy 3.7 build lives (manual installs only).
export const OLD_GMG_URL: string = import.meta.env.VITE_OLD_GMG_URL || "https://old.gmg.tabletop-almanac.com";

// Tutorial / migration video (reused from the existing GMG 4 notice).
export const GMG4_TUTORIAL_URL = "https://youtu.be/KR4iyedauYg";

// The day the new stack took over (2026-11-09, end of the 08:00-12:00 CET window); the old
// stack is a frozen copy from then. This build keeps running on it for as long as it works,
// without updates or support - there is no switch-off date.
export const CUTOVER_DATE = new Date("2026-11-09T11:00:00Z");
