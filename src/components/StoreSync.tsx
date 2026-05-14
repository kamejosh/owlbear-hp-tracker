import { partyStore } from "../context/PartyStore.tsx";
import { abilityShareStore } from "../context/AbilityShareStore.tsx";
import { diceButtonsStore } from "../context/DiceButtonContext.tsx";
import { rollLogStore } from "../context/RollLogContext.tsx";
import { useStorageSync } from "../helper/hooks.ts";

/**
 * Component that manages the synchronization of vanilla Zustand stores with localStorage events.
 * This ensures that state is synced across different tabs/windows.
 * By using a component with useEffect, we ensure listeners are properly added/removed
 * and avoid memory leaks or duplicate listeners during HMR.
 */
export const StoreSync = () => {
    useStorageSync(partyStore);
    useStorageSync(abilityShareStore);
    useStorageSync(diceButtonsStore);
    useStorageSync(rollLogStore);

    return null;
};
