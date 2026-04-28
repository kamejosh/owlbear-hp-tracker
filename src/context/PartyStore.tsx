import { useStore } from "zustand";
import { ID } from "../helper/variables.ts";
import { PartyOut } from "../api/tabletop-almanac/useParty.ts";
import { createJSONStorage, persist } from "zustand/middleware";
import { Metadata } from "@owlbear-rodeo/sdk";
import { components } from "../api/schema";
import { createStore } from "zustand/vanilla";
import { withStorageDOMEvents } from "../helper/hooks.ts";
import { subscribeWithSelector } from "zustand/middleware";
import _, { isUndefined } from "lodash";

export type SimpleE5StatblockOut = components["schemas"]["SimpleE5StatblockOut"];

export type PartyStoreStatblock = {
    partyStatblockId: number;
    statblock?: SimpleE5StatblockOut | null;
    imageUrl?: string | null;
    playerId?: string | null;
    metadata?: Metadata | null;
};

export type PartySettings = {
    id: number;
    name: string;
    group: string;
    members: Array<PartyStoreStatblock>;
};

export type PartyStore = {
    parties: Array<PartySettings>;
    addParty: (party: PartyOut) => void;
    currentParty: PartySettings | null;
    currentPartyId: number | null;
    setCurrentParty: (id?: number | null) => void;
    updateMember: (member: PartyStoreStatblock) => void;
    updateMembers: (members: PartyStoreStatblock[]) => void;
};

export const partyStore = createStore<PartyStore>()(
    subscribeWithSelector(
        persist<PartyStore>(
            (set) => ({
                parties: [],
                currentPartyId: null,

                addParty: (party) =>
                    set((state) => {
                        const existingParty = state.parties.find((p) => p.id === party.id);

                        const newMembers: Array<PartyStoreStatblock> =
                            party.statblocks?.map((s) => {
                                const existingMember = existingParty?.members.find((m) => m.partyStatblockId === s.id);
                                return {
                                    ...existingMember,
                                    partyStatblockId: s.id,
                                    statblock: s.statblock,
                                };
                            }) ?? [];

                        const newParty: PartySettings = {
                            id: party.id,
                            name: party.name,
                            group: party.group_name ?? "Default",
                            members: newMembers,
                        };

                        let newState: Partial<PartyStore> = {};

                        if (!existingParty) {
                            newState.parties = [...state.parties, newParty];
                        } else if (!_.isEqual(existingParty, newParty)) {
                            newState.parties = state.parties.map((p) => (p.id === party.id ? newParty : p));
                        }

                        if (state.currentPartyId === newParty.id) {
                            newState.currentParty = newParty;
                        }

                        return newState;
                    }),

                currentParty: null,

                setCurrentParty: (id) =>
                    set((state) => {
                        if (id === null || id === undefined) {
                            return { currentPartyId: null, currentParty: null };
                        }
                        const party = state.parties.find((p) => p.id === id);
                        return { currentPartyId: id, currentParty: party ?? null };
                    }),
                updateMember: (member) =>
                    set((state) => {
                        const memberIndex = state.currentParty?.members.findIndex(
                            (m) => m.partyStatblockId === member.partyStatblockId,
                        );

                        if (!isUndefined(memberIndex) && memberIndex >= 0 && state.currentParty) {
                            const party = { ...state.currentParty };
                            party.members = [...party.members];
                            party.members[memberIndex] = member;

                            return {
                                parties: state.parties.map((p) => (p.id === party.id ? party : p)),
                                currentParty: party,
                            };
                        }
                        return {};
                    }),
                updateMembers: (members) =>
                    set((state) => {
                        if (!state.currentParty) {
                            return {};
                        }
                        const party = { ...state.currentParty };
                        party.members = [...party.members];
                        let changed = false;

                        members.forEach((member) => {
                            const memberIndex = party.members.findIndex(
                                (m) => m.partyStatblockId === member.partyStatblockId,
                            );
                            if (memberIndex >= 0) {
                                party.members[memberIndex] = member;
                                changed = true;
                            }
                        });

                        if (changed) {
                            return {
                                parties: state.parties.map((p) => (p.id === party.id ? party : p)),
                                currentParty: party,
                            };
                        }
                        return {};
                    }),
            }),
            {
                name: `${ID}.party-store`,
                storage: createJSONStorage(() => localStorage),
            },
        ),
    ),
);

export function usePartyStore(): PartyStore;
export function usePartyStore<T>(selector: (state: PartyStore) => T): T;
export function usePartyStore<T>(selector?: (state: PartyStore) => T) {
    return useStore(partyStore, selector!);
}
withStorageDOMEvents(partyStore);
