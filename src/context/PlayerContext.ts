import React, { useContext } from "react";

export type PlayerContextType = {
  role: string | null;
};

export const PlayerContext = React.createContext<PlayerContextType | null>(
  null
);

export const usePlayerContext = (): PlayerContextType => {
  const playerContext = useContext(PlayerContext);
  if (playerContext === null) {
    throw new Error("Player not yet set");
  }

  return playerContext;
};
