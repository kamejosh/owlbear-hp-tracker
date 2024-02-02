import { createContext, useContext } from "react";

export type PlayerContextType = {
    role: string | null;
    id: string | null;
    name: string | null;
};

export const PlayerContext = createContext<PlayerContextType | null>(null);

export const usePlayerContext = (): PlayerContextType => {
    const playerContext = useContext(PlayerContext);
    if (playerContext === null) {
        throw new Error("Player not yet set");
    }

    return playerContext;
};
