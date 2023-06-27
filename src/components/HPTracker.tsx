import React, { useState } from "react";
import { ContextWrapper } from "./ContextWrapper.tsx";
import { usePlayerContext } from "../context/PlayerContext.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";

export const HPTracker = () => {
  return (
    <ContextWrapper>
      <Content />
    </ContextWrapper>
  );
};

const Content = () => {
  const playerContext = usePlayerContext();
  const [tokens, setTokens] = useState<Item[] | undefined>(undefined);

  OBR.onReady(() => {
    OBR.scene.items.onChange(async (items) => {
      // console.log(items);
      // setTokens(items);
    });
  });

  return playerContext.role ? (
    playerContext.role === "PLAYER" ? (
      <h1>Only for GMs</h1>
    ) : (
      <>
        <h1>HP Tracker</h1>
        {tokens?.map((token) => {
          // console.log(token.metadata);
        })}
      </>
    )
  ) : (
    <h1>Waiting for OBR startup</h1>
  );
};
