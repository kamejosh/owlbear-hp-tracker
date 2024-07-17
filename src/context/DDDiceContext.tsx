import { createStore } from "zustand/vanilla";
import { IRoom, ITheme, ThreeDDice, ThreeDDiceAPI } from "dddice-js";
import { useStore } from "zustand";

export type DiceRoller = {
    roller: ThreeDDice;
    rollerApi: ThreeDDiceAPI | null;
    setRollerApi: (api: ThreeDDiceAPI) => void;
    initialized: boolean;
    setInitialized: (initialized: boolean) => void;
    theme: ITheme | null;
    setTheme: (theme: ITheme | null) => void;
    themes: Array<ITheme> | null;
    setThemes: (themes: Array<ITheme>) => void;
    rooms: Array<IRoom>;
    setRooms: (rooms: Array<IRoom>) => void;
    dddiceExtensionLoaded: boolean;
    setDddiceExtensionLoaded: (dddiceExtensionLoaded: boolean) => void;
};

export const diceRollerStore = createStore<DiceRoller>()((set) => ({
    roller: new ThreeDDice(),
    rollerApi: null,
    setRollerApi: (api) =>
        set(() => {
            return { rollerApi: api };
        }),
    initialized: false,
    setInitialized: (initialized: boolean) => set(() => ({ initialized: initialized })),
    theme: null,
    setTheme: (theme) =>
        set((state) => {
            if (state.theme?.id !== theme?.id) {
                return {
                    theme: theme,
                };
            }
            return state;
        }),
    themes: null,
    setThemes: (themes) =>
        set(() => {
            return { themes: themes };
        }),
    rooms: [],
    setRooms: (rooms) =>
        set(() => {
            return { rooms: rooms };
        }),
    dddiceExtensionLoaded: false,
    setDddiceExtensionLoaded: (dddiceExtensionLoaded) => set(() => ({ dddiceExtensionLoaded: dddiceExtensionLoaded })),
}));

export function useDiceRoller(): DiceRoller;
export function useDiceRoller<T>(selector: (state: DiceRoller) => T): T;
export function useDiceRoller<T>(selector?: (state: DiceRoller) => T) {
    return useStore(diceRollerStore, selector!);
}
