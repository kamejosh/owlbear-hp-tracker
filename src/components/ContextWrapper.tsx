import OBR from "@owlbear-rodeo/sdk";
import { PlayerContext, PlayerContextType } from "../context/PlayerContext.ts";
import React, { PropsWithChildren, useState } from "react";

export const ContextWrapper = (props: PropsWithChildren) => {
  const [role, setRole] = useState<string | null>(null);

  OBR.onReady(async () => {
    setRole(await OBR.player.getRole());
  });

  const playerContext: PlayerContextType = { role: role };

  return (
    <PlayerContext.Provider value={playerContext}>
      {props.children}
    </PlayerContext.Provider>
  );
};
