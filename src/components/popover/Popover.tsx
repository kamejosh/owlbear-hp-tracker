import React, { useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR from "@owlbear-rodeo/sdk";

export const Popover = () => {
  return (
    <ContextWrapper>
      <Content />
    </ContextWrapper>
  );
};

const Content = () => {
  const playerContext = usePlayerContext();
  const id = new URLSearchParams(window.location.search).get("id") ?? null;
  // const [obrContext, setObrContext] = useState();

  console.log(id);

  OBR.onReady(async () => {
    if (id) {
      console.log(await OBR.scene.items.getItems([id]));
    }
  });

  return playerContext.role ? (
    playerContext.role === "PLAYER" ? (
      <></>
    ) : (
      <Layer />
    )
  ) : (
    <h1>Waiting for OBR startup</h1>
  );
};

const Layer = () => {
  return <div className={"wrapper"}></div>;
};
