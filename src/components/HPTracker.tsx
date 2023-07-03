import React, { ChangeEvent, MouseEvent, useEffect, useState } from "react";
import { ContextWrapper } from "./ContextWrapper.tsx";
import { usePlayerContext } from "../context/PlayerContext.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { ID } from "../helper/variables.ts";
import { HpTrackerMetadata } from "../helper/types.ts";
import "./hp-tracker.scss";

type PlayerProps = {
    id: string;
    data: HpTrackerMetadata;
};

export const HPTracker = () => {
    return (
        <ContextWrapper>
            <Content />
        </ContextWrapper>
    );
};

const Player = (props: PlayerProps) => {
    const handleHpChange = (event: ChangeEvent<HTMLInputElement>) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                const currentData: HpTrackerMetadata = item.metadata[`${ID}/data`] as HpTrackerMetadata;
                currentData.hp = Number(event.target.value);
                item.metadata[`${ID}/data`] = currentData;
            });
        });
    };

    const handleOnPlayerClick = (event: MouseEvent) => {
        OBR.scene.items.updateItems([props.id], (items) => {
            items.forEach((item) => {
                if (event.type === "mousedown") {
                    item.rotation = 10;
                } else {
                    item.rotation = 0;
                }
            });
        });
    };

    return props.data.hpTrackerActive ? (
        <div className={"player-wrapper"}>
            <div
                className={"player-name"}
                onMouseDown={handleOnPlayerClick}
                onMouseUp={handleOnPlayerClick}
                onMouseLeave={handleOnPlayerClick}
            >
                {props.data.name}
            </div>
            <span>
                <input type={"number"} defaultValue={props.data.hp} max={props.data.maxHp} onChange={handleHpChange} />/
                {props.data.maxHp}
            </span>
        </div>
    ) : (
        <></>
    );
};

const Content = () => {
    const playerContext = usePlayerContext();
    const [tokens, setTokens] = useState<Item[] | undefined>(undefined);

    useEffect(() => {
        OBR.onReady(() => {
            OBR.scene.items.onChange(async (items) => {
                const filteredItems = items.filter((item) => item.layer === "CHARACTER");
                setTokens(filteredItems);
            });
        });
    }, []);

    return playerContext.role ? (
        playerContext.role === "PLAYER" ? (
            <h1>Only for GMs</h1>
        ) : (
            <>
                <h1>HP Tracker</h1>
                {tokens?.map((token) => {
                    const data = token.metadata[`${ID}/data`] as HpTrackerMetadata;
                    return <Player key={token.id} id={token.id} data={data} />;
                })}
            </>
        )
    ) : (
        <h1>Waiting for OBR startup</h1>
    );
};
