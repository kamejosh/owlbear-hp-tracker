import { ListPartiesParams, PartyPagination } from "../api/tabletop-almanac/useParty.ts";
import _ from "lodash";
import OBR, { Image, Item, Metadata } from "@owlbear-rodeo/sdk";
import { PartySettings, PartyStoreStatblock } from "../context/PartyStore.tsx";
import { itemMetadataKey, metadataKey } from "../helper/variables.ts";
import { GMGMetadata, RoomMetadata, SceneMetadata } from "../helper/types.ts";
import { getCurrentParty, getPartyId, updateSceneMetadata } from "../helper/helpers.ts";
import { partyStore } from "../context/PartyStore.tsx";
import { listParties } from "../api/tabletop-almanac/useParty.ts";
import { updateHp } from "../helper/hpHelpers.ts";
import { updateAc } from "../helper/acHelper.ts";
import { updateItems, updateList } from "../helper/obrHelper.ts";

let pollingTimeout: ReturnType<typeof setTimeout> | null = null;
let failedToken: string | null = null;
let retryCount = 0;

/** True while applyPartyToTokens is writing, so the resulting onChange echo is ignored. */
let applyingPartyToScene = false;
/**
 * itemId -> the party token's metadata as we last knew it to be correct (post scene-open
 * apply, or post accepted edit). onChange only treats a token as edited when its metadata
 * differs from this, which stops a freshly opened scene from writing its old values into
 * the party store.
 */
let tokenMetadataBaseline = new Map<string, Metadata>();
/**
 * True once applyPartyToTokens has stamped the current scene against a real party. Until then a
 * token without a baseline is not trusted (its metadata may be left over from a previous
 * session); afterwards a token without a baseline is one that joined the party after the apply
 * (e.g. a statblock was just assigned to it), so its metadata is a genuine edit.
 */
let appliedPartyToScene = false;
/** Bumped for every apply run; a run whose generation is stale aborts instead of writing. */
let applyGeneration = 0;
/** The apply currently in flight, so overlapping callers join it instead of starting a second. */
let applyInFlight: Promise<void> | null = null;

export const startPartyPolling = async (params: ListPartiesParams) => {
    stopPartyPolling();
    const addParty = partyStore.getState().addParty;
    const poll = async () => {
        try {
            // Grab the latest token straight from the Zustand store
            const roomMetadata = await OBR.room.getMetadata();
            const token =
                metadataKey in roomMetadata ? (roomMetadata[metadataKey] as RoomMetadata).tabletopAlmanacAPIKey : null;

            if (token) {
                if (token === failedToken) {
                    return;
                }

                try {
                    const response = await listParties({ params, token });
                    const newData = response.data as PartyPagination;

                    newData.page.forEach((party) => {
                        addParty(party);
                    });

                    // Reset on success
                    retryCount = 0;
                    failedToken = null;
                } catch (error: any) {
                    if (error?.status === 401 || error?.response?.status === 401) {
                        retryCount++;
                        if (retryCount >= 2) {
                            failedToken = token;
                            console.warn("Game Master's Grimoire - Syncing Parties stopped: Unauthorized");
                            return;
                        }
                    }
                    console.error("Game Master's Grimoire - Failed to fetch parties:", error);
                }
            } else {
                return;
            }
        } catch (error) {
            console.error("Game Master's Grimoire - Failed to fetch parties:", error);
        } finally {
            // Schedule the next poll exactly 30 seconds after this one finishes
            // Only if we haven't returned early (halted)
            if (!failedToken) {
                const roomMetadata = await OBR.room.getMetadata();
                const token =
                    metadataKey in roomMetadata
                        ? (roomMetadata[metadataKey] as RoomMetadata).tabletopAlmanacAPIKey
                        : null;
                if (token) {
                    pollingTimeout = setTimeout(poll, 30000);
                }
            }
        }
    };

    // Kick off the first request immediately
    await poll();

    // Return a cleanup function so you can stop polling when needed
    return () => stopPartyPolling();
};

export const stopPartyPolling = () => {
    if (pollingTimeout) {
        clearTimeout(pollingTimeout);
        pollingTimeout = null;
    }
};

const initPlayerPartyMembers = async (items: Array<Item>) => {
    const partyId = await getPartyId();
    const currentParty = await getCurrentParty();
    const membersToUpdate: PartyStoreStatblock[] = [];
    items.forEach((item) => {
        if (item.type === "IMAGE" && itemMetadataKey in item.metadata) {
            const image = item as Image;
            const data = item.metadata[itemMetadataKey] as GMGMetadata;
            const member = data.sheet
                ? currentParty?.members.find((member) => member.statblock?.slug === data.sheet)
                : undefined;

            if (member) {
                const newMember: PartyStoreStatblock = { ...member };

                if (item.createdUserId !== member.playerId) {
                    newMember.playerId = item.createdUserId;
                }

                if (!member.imageUrl) {
                    newMember.imageUrl = image.image.url;
                }

                if (!_.isEqual(member, newMember)) {
                    membersToUpdate.push(newMember);
                }
            }
        }
    });

    if (membersToUpdate.length > 0 && partyId) {
        partyStore.getState().updateMembers(partyId, membersToUpdate);
    }
};

/** Room-scoped player setup: call exactly once, no scene needed. */
export const initPlayerPartyRoom = async () => {
    const room = await OBR.room.getMetadata();
    if (metadataKey in room) {
        const roomMetadata = room[metadataKey] as RoomMetadata;
        const apiKey = roomMetadata.tabletopAlmanacAPIKey;
        if (apiKey) {
            try {
                await startPartyPolling({ limit: 100, offset: 0 });
            } catch (e) {
                console.error("GM's Grimoire - Error while fetching parties", e);
            }
        }
    }

    OBR.room.onMetadataChange((metadata) => {
        const gmgMetadata = metadata[metadataKey] as RoomMetadata;
        if (gmgMetadata) {
            const apiKey = gmgMetadata.tabletopAlmanacAPIKey;
            if (apiKey && apiKey !== failedToken && !pollingTimeout) {
                void startPartyPolling({ limit: 100, offset: 0 });
            }
        }
    });
};

let playerItemsUnsubscribe: (() => void) | null = null;
/**
 * Setup and teardown run one after another. Both can be triggered for a single scene load
 * (OBR.scene.onReadyChange and the initial isReady() check), and without serialization both would
 * unsubscribe the same null handle, subscribe, and orphan one of the two subscriptions - which
 * then keeps firing, duplicating party store writes and outliving the scene.
 */
let playerSceneQueue: Promise<void> = Promise.resolve();

const queuePlayerSceneTask = (task: () => Promise<void> | void): Promise<void> => {
    const run = playerSceneQueue.then(task);
    playerSceneQueue = run.catch(() => {});
    return run;
};

/** Scene-scoped player setup: safe to call on every scene ready, replaces its own subscription. */
export const initPlayerPartyScene = async () =>
    queuePlayerSceneTask(async () => {
        playerItemsUnsubscribe?.();
        playerItemsUnsubscribe = null;

        const items = await OBR.scene.items.getItems();
        await initPlayerPartyMembers(items);

        playerItemsUnsubscribe = OBR.scene.items.onChange((items) => {
            void initPlayerPartyMembers(items);
        });
    });

export const teardownPlayerPartyScene = () =>
    queuePlayerSceneTask(() => {
        playerItemsUnsubscribe?.();
        playerItemsUnsubscribe = null;
    });

const findPartyMember = (item: Item, currentParty: PartySettings) => {
    const image = item as Image;
    if (itemMetadataKey in item.metadata) {
        const data = item.metadata[itemMetadataKey] as GMGMetadata;
        return data.sheet ? currentParty.members.find((member) => member.statblock?.slug === data.sheet) : undefined;
    }
    return currentParty.members.find((member) => member.imageUrl === image.image.url);
};

/** Stamps `member`'s stored metadata onto `item` in place. Returns true if the metadata changed. */
const applyMemberToItem = (item: Item, member: PartyStoreStatblock | undefined, group: string | undefined): boolean => {
    let metadataChanged = false;
    if (member?.metadata && !_.isEqual(member.metadata, item.metadata)) {
        const data = { ...member.metadata };
        if (itemMetadataKey in member.metadata) {
            data[itemMetadataKey] = { ...(member.metadata[itemMetadataKey] as GMGMetadata), group };
        }
        item.metadata = data;
        metadataChanged = true;
    }
    if (member?.playerId && member.playerId !== item.createdUserId) {
        item.createdUserId = member.playerId;
    }
    return metadataChanged;
};

/** Refreshes the HP/AC display of tokens whose GMG metadata was just changed. */
const refreshTokenDisplays = async (tokenIds: Set<string>) => {
    if (tokenIds.size === 0) {
        return;
    }
    const tokens = await OBR.scene.items.getItems([...tokenIds]);
    // Each token can trigger up to four sub-mutations (HP bar, HP text, AC shape, visibility),
    // so keep the chunk size small to stay under OBR's rate limit.
    await updateList(tokens, 2, async (subList) => {
        for (const token of subList) {
            if (itemMetadataKey in token.metadata) {
                const metadata = token.metadata[itemMetadataKey] as GMGMetadata;
                await updateHp(token, metadata);
                await updateAc(token, metadata);
            }
        }
    });
};

/** Invalidates an apply that is still in flight - used when the scene it belongs to goes away. */
const abortApplyPartyToTokens = () => {
    applyGeneration++;
    applyInFlight = null;
    applyingPartyToScene = false;
    appliedPartyToScene = false;
    tokenMetadataBaseline = new Map<string, Metadata>();
};

const runApplyPartyToTokens = async (generation: number) => {
    const isCurrent = () => generation === applyGeneration;

    applyingPartyToScene = true;
    appliedPartyToScene = false;
    // Held locally as well, so an aborted run writes into its own orphaned map instead of into
    // the one the scene that replaced it is using.
    const baseline = new Map<string, Metadata>();
    tokenMetadataBaseline = baseline;
    try {
        const currentParty = await getCurrentParty();
        if (!isCurrent()) {
            return;
        }
        if (!currentParty || currentParty.members.length === 0) {
            // No party to stamp, so the tokens keep whatever they carry - which we must not trust
            // as party state. appliedPartyToScene stays false, and onChange stays conservative.
            return;
        }

        const items = await OBR.scene.items.getItems(
            (item) => item.type === "IMAGE" && (item.layer === "CHARACTER" || item.layer === "MOUNT"),
        );
        if (!isCurrent()) {
            return;
        }

        const partyTokenIds: Array<string> = [];
        const membersByItemId = new Map<string, PartyStoreStatblock>();
        for (const item of items) {
            const member = findPartyMember(item, currentParty);
            if (!member) {
                continue;
            }
            partyTokenIds.push(item.id);
            if (
                (member.metadata && !_.isEqual(member.metadata, item.metadata)) ||
                (member.playerId && member.playerId !== item.createdUserId)
            ) {
                membersByItemId.set(item.id, member);
            }
        }

        // A Set, because updateItems replays the callback after a rate limit retry.
        const newTokenIds = new Set<string>();
        if (membersByItemId.size > 0) {
            await updateItems([...membersByItemId.keys()], (drafts) => {
                for (const item of drafts) {
                    if (applyMemberToItem(item, membersByItemId.get(item.id), currentParty.group)) {
                        newTokenIds.add(item.id);
                    }
                }
            });
            if (!isCurrent()) {
                return;
            }
        }

        // Take the baseline from what OBR actually persisted, not from the update drafts. If the
        // write only partially applied, the baseline matches reality, onChange sees no diff and
        // leaves the store alone, and the next scene open re-applies.
        const persisted = await OBR.scene.items.getItems(partyTokenIds);
        if (!isCurrent()) {
            return;
        }
        for (const token of persisted) {
            baseline.set(token.id, token.metadata);
        }
        appliedPartyToScene = true;

        // Everything that could echo back as a token metadata change is written and baselined by
        // now, so drop the guard before the display refresh - that part deliberately runs slowly
        // (~500ms per two tokens) and any real edit during it must not be swallowed.
        applyingPartyToScene = false;

        await refreshTokenDisplays(newTokenIds);
    } finally {
        if (isCurrent()) {
            applyingPartyToScene = false;
        }
    }
};

/**
 * Forces every party token already present in the scene to take on the values currently stored
 * for its party member, instead of only applying them when a token is first matched to the party.
 * Runs on scene switch so stale values from a previous session don't linger.
 */
export const applyPartyToTokens = async (): Promise<void> => {
    // Both OBR.scene.onReadyChange and the initial isReady() check can fire for one scene load.
    // Join the run that is already going instead of starting a second one, which would reset the
    // baseline map the first one just filled and clear the echo guard while it is still writing.
    if (applyInFlight) {
        return applyInFlight;
    }
    const generation = ++applyGeneration;
    const run = runApplyPartyToTokens(generation).finally(() => {
        if (generation === applyGeneration) {
            applyInFlight = null;
        }
    });
    applyInFlight = run;
    return run;
};

export const initParty = async () => {
    await startPartyPolling({ limit: 100, offset: 0 });

    // re-apply the latest party values to tokens whenever a scene is opened, so tokens that
    // already carry metadata from a previous session don't keep stale values
    OBR.scene.onReadyChange(async (isReady) => {
        if (isReady) {
            await applyPartyToTokens();
        } else {
            abortApplyPartyToTokens();
        }
    });
    if (await OBR.scene.isReady()) {
        await applyPartyToTokens();
    }

    // The apply above finds nothing when the party has not been fetched yet - then no token is
    // stamped, no baseline is taken, and token edits stay untrusted. Retry as soon as the party
    // arrives instead of waiting for the next scene open.
    partyStore.subscribe(() => {
        if (appliedPartyToScene || applyInFlight) {
            return;
        }
        void (async () => {
            if (await OBR.scene.isReady()) {
                await applyPartyToTokens();
            }
        })();
    });

    // subscribe to party changes
    OBR.room.onMetadataChange(async (metadata) => {
        const gmgMetadata = metadata[metadataKey] as RoomMetadata;
        if (gmgMetadata) {
            const apiKey = gmgMetadata.tabletopAlmanacAPIKey;
            if (apiKey && apiKey !== failedToken && !pollingTimeout) {
                void startPartyPolling({ limit: 100, offset: 0 });
            }
            if (gmgMetadata.partyId) {
                const sceneMetadata = await OBR.scene.getMetadata();
                if (metadataKey in sceneMetadata) {
                    const currentParty = await getCurrentParty();
                    const gmgScene = sceneMetadata[metadataKey] as SceneMetadata;
                    const sceneGroups = gmgScene.groups ?? [];
                    if (currentParty && !sceneGroups.includes(currentParty.group)) {
                        await updateSceneMetadata(gmgScene, { groups: [...sceneGroups, currentParty.group] });
                    }
                }
            }
        }
    });

    // subscribe to token changes
    OBR.scene.items.onChange(async (items) => {
        // Synchronous guard - must run before the first await, otherwise the echo of our own
        // scene-open write slips through and poisons the party store with stale token values.
        if (applyingPartyToScene) {
            return;
        }
        // A Set, because updateItems replays the callback after a rate limit retry.
        const newTokenIds = new Set<string>();
        const partyId = await getPartyId();
        const currentParty = await getCurrentParty();
        const membersToUpdate: PartyStoreStatblock[] = [];
        const itemsToApply: Array<string> = [];

        items.forEach((item) => {
            if (item.type === "IMAGE" && (item.layer === "CHARACTER" || item.layer === "MOUNT")) {
                const image = item as Image;
                const member = currentParty ? findPartyMember(item, currentParty) : undefined;
                if (itemMetadataKey in item.metadata) {
                    if (member) {
                        const newMember: PartyStoreStatblock = { ...member };

                        if (item.createdUserId !== OBR.player.id && item.createdUserId !== member.playerId) {
                            newMember.playerId = item.createdUserId;
                        }

                        if (!member.imageUrl) {
                            newMember.imageUrl = image.image.url;
                        }

                        // Only treat this as an edit when the token's metadata moved away from
                        // the value we last vouched for. A token without a baseline joined the
                        // party after the scene-open apply (a statblock was just assigned, or the
                        // token was just dropped in), so its metadata is a genuine edit and has to
                        // reach the store - otherwise the next scene open would stamp the stale
                        // stored values back over it. Before that apply has run we cannot tell an
                        // edit from leftovers of a previous session, so we only record it.
                        const baseline = tokenMetadataBaseline.get(item.id);
                        if (!baseline && !appliedPartyToScene) {
                            tokenMetadataBaseline.set(item.id, item.metadata);
                        } else if (!_.isEqual(item.metadata, baseline)) {
                            newMember.metadata = item.metadata;
                            tokenMetadataBaseline.set(item.id, item.metadata);
                        }

                        if (!_.isEqual(member, newMember)) {
                            membersToUpdate.push(newMember);
                        }
                    }
                } else if (member?.metadata && !_.isEqual(member.metadata, item.metadata)) {
                    itemsToApply.push(item.id);
                }
            }
        });

        if (membersToUpdate.length > 0 && partyId) {
            partyStore.getState().updateMembers(partyId, membersToUpdate);
        }

        // Batch all metadata applications into a single rate-limit-aware update instead of
        // firing one unbatched updateItems per token (which overruns OBR's rate limit).
        if (itemsToApply.length > 0 && currentParty) {
            await updateItems(itemsToApply, (drafts) => {
                for (const draft of drafts) {
                    const member = findPartyMember(draft, currentParty);
                    if (member && applyMemberToItem(draft, member, currentParty.group)) {
                        newTokenIds.add(draft.id);
                    }
                }
            });

            // these tokens just took on the store's values, so that is the correct baseline
            for (const token of await OBR.scene.items.getItems(itemsToApply)) {
                tokenMetadataBaseline.set(token.id, token.metadata);
            }
        }

        await refreshTokenDisplays(newTokenIds);
    });
};
