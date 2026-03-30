import { useStore } from "zustand";
import { ID } from "../helper/variables.ts";
import { PartyOut } from "../api/tabletop-almanac/useParty.ts";
import { createJSONStorage, persist } from "zustand/middleware";
import { Metadata } from "@owlbear-rodeo/sdk";
import { components } from "../api/schema";
import { createStore } from "zustand/vanilla";
import { withStorageDOMEvents } from "../helper/hooks.ts";
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
    setCurrentParty: (id: number) => void;
    updateMember: (member: PartyStoreStatblock) => void;
};

export const partyStore = createStore<PartyStore>()(
    persist<PartyStore>(
        (set) => ({
            parties: [],

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

                    if (!existingParty) {
                        return {
                            parties: [...state.parties, newParty],
                        };
                    } else if (!_.isEqual(existingParty, newParty)) {
                        return {
                            parties: state.parties.map((p) => {
                                if (p.id === party.id) {
                                    return newParty;
                                } else {
                                    return p;
                                }
                            }),
                        };
                    }
                    return {};
                }),

            currentParty: null,

            setCurrentParty: (id) =>
                set((state) => {
                    const party = state.parties.find((p) => p.id === id);
                    if (party) {
                        return { currentParty: party };
                    }
                    return { currentParty: null };
                }),
            updateMember: (member) =>
                set((state) => {
                    const memberIndex = state.currentParty?.members.findIndex(
                        (m) => m.partyStatblockId === member.partyStatblockId,
                    );

                    if (!isUndefined(memberIndex) && memberIndex >= 0 && state.currentParty) {
                        const party = { ...state.currentParty };
                        party.members[memberIndex] = member;

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
);

export function usePartyStore(): PartyStore;
export function usePartyStore<T>(selector: (state: PartyStore) => T): T;
export function usePartyStore<T>(selector?: (state: PartyStore) => T) {
    return useStore(partyStore, selector!);
}
withStorageDOMEvents(partyStore);
