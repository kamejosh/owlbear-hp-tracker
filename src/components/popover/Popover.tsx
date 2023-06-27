import React, { useEffect, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import "./popover.scss";
import { ID } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";

export const Popover = () => {
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
      <></>
    ) : (
      <Layer />
    )
  ) : (
    <h1>Waiting for OBR startup</h1>
  );
};

const Layer = () => {
  const id = new URLSearchParams(window.location.search).get("id") ?? null;
  const [hp, setHp] = useState<number>(0);
  const [maxHp, setMaxHp] = useState<number>(0);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (id) {
      OBR.scene.items.updateItems([id], (items) => {
        items.forEach((item) => {
          item.metadata[`${ID}/data`] = {
            name: name,
            maxHp: maxHp,
            hp: hp,
          };
        });
      });
    }
  }, [hp, maxHp, name]);

  OBR.onReady(async () => {
    if (id) {
      const items = await OBR.scene.items.getItems([id]);
      if (items.length > 0) {
        const item = items[0];
        if (`${ID}/data` in item.metadata) {
          console.log(item.metadata[`${ID}/data`]);
          const data = item.metadata[`${ID}/data`] as HpTrackerMetadata;
          setName(data.name ?? "");
          setHp(data.hp ?? 0);
          setMaxHp(data.maxHp ?? 0);
        }
      }
    }
  });

  return (
    <div className={"popover-wrapper"}>
      <input
        type={"number"}
        defaultValue={maxHp}
        min={0}
        onChange={(e) => {
          setMaxHp(Number(e.target.value));
        }}
      ></input>
      <input
        type={"number"}
        defaultValue={hp}
        max={maxHp}
        min={0}
        onChange={(e) => {
          setHp(Number(e.target.value));
        }}
      ></input>
      <input
        type={"text"}
        defaultValue={name}
        onChange={(e) => {
          setName(e.target.value);
        }}
      ></input>
    </div>
  );
};
