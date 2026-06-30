import { useStore } from "zustand";
import { ID } from "../helper/variables.ts";
import { PartyOut } from "../api/tabletop-almanac/useParty.ts";
import { createJSONStorage, persist } from "zustand/middleware";
import { Metadata } from "@owlbear-rodeo/sdk";
import { components } from "../api/schema";
import { createStore } from "zustand/vanilla";
import { subscribeWithSelector } from "zustand/middleware";
import _ from "lodash";

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
    // We pass the partyId explicitly now, instead of relying on internal state
    updateMember: (partyId: number, member: PartyStoreStatblock) => void;
    updateMembers: (partyId: number, members: PartyStoreStatblock[]) => void;
};

export const partyStore = createStore<PartyStore>()(
    subscribeWithSelector(
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
                            return { parties: [...state.parties, newParty] };
                        } else if (!_.isEqual(existingParty, newParty)) {
                            return { parties: state.parties.map((p) => (p.id === party.id ? newParty : p)) };
                        }

                        return {};
                    }),

                updateMember: (partyId, member) =>
                    set((state) => {
                        const targetParty = state.parties.find((p) => p.id === partyId);
                        if (!targetParty) return {};

                        const memberIndex = targetParty.members.findIndex(
                            (m) => m.partyStatblockId === member.partyStatblockId,
                        );

                        if (memberIndex >= 0) {
                            const updatedParty = { ...targetParty, members: [...targetParty.members] };
                            updatedParty.members[memberIndex] = member;

                            return {
                                parties: state.parties.map((p) => (p.id === updatedParty.id ? updatedParty : p)),
                            };
                        }
                        return {};
                    }),

                updateMembers: (partyId, members) =>
                    set((state) => {
                        const targetParty = state.parties.find((p) => p.id === partyId);
                        if (!targetParty) return {};

                        const updatedParty = { ...targetParty, members: [...targetParty.members] };
                        let changed = false;

                        members.forEach((member) => {
                            const memberIndex = updatedParty.members.findIndex(
                                (m) => m.partyStatblockId === member.partyStatblockId,
                            );
                            if (memberIndex >= 0) {
                                updatedParty.members[memberIndex] = member;
                                changed = true;
                            }
                        });

                        if (changed) {
                            return {
                                parties: state.parties.map((p) => (p.id === updatedParty.id ? updatedParty : p)),
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
