import { create } from "zustand";

export type CharacterSheet = {
    characterId: string | null;
    setId: (id: string | null) => void;
};

export const useCharSheet = create<CharacterSheet>()((set) => ({
    characterId: null,
    setId: (id) => set(() => ({ characterId: id })),
}));
