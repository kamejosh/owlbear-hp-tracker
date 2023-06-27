import React from "react";
import { ContextWrapper } from "./ContextWrapper.tsx";
import { usePlayerContext } from "../context/PlayerContext.ts";

export const HPTracker = () => {
  return (
    <ContextWrapper>
      <Content />
    </ContextWrapper>
  );
};

const Content = () => {
  const playerContext = usePlayerContext();

  return playerContext.role ? (
    playerContext.role === "PLAYER" ? (
      <h1>Only for GMs</h1>
    ) : (
      <h1>HP Tracker</h1>
    )
  ) : (
    <h1>Waiting for OBR startup</h1>
  );
};
