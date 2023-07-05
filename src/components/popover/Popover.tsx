import React, { useEffect, useState } from "react";
import { ContextWrapper } from "../ContextWrapper.tsx";
import { usePlayerContext } from "../../context/PlayerContext.ts";
import OBR from "@owlbear-rodeo/sdk";
import "./popover.scss";
import { characterMetadata, textMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import { createText } from "../../helper/helpers.ts";

export const Popover = () => {
    return (
        <ContextWrapper>
            <Content />
        </ContextWrapper>
    );
};

const Content = () => {
    const playerContext = usePlayerContext();

    return playerContext.role ? playerContext.role === "PLAYER" ? <></> : <Layer /> : <h1>Waiting for OBR startup</h1>;
};

const Layer = () => {
    const id = new URLSearchParams(window.location.search).get("id") ?? null;
    const [hp, setHp] = useState<number>(0);
    const [maxHp, setMaxHp] = useState<number>(0);
    const [name, setName] = useState<string>("");
    const [hpTrackerActive, setHpTrackerActive] = useState<boolean>(false);
    const [canPlayersSee, setCanPlayersSee] = useState<boolean>(false);
    const [hpOnMap, setHpOnMap] = useState<string>("");

    useEffect(() => {
        if (id) {
            OBR.scene.items.updateItems([id], (items) => {
                items.forEach((item) => {
                    const data = {
                        name: name,
                        maxHp: maxHp,
                        hp: hp,
                        hpTrackerActive: hpTrackerActive,
                        canPlayersSee: canPlayersSee,
                        hpOnMap: hpOnMap,
                    };
                    item.metadata[characterMetadata] = {
                        ...data,
                    };
                });
            });
        }
    }, [hp, maxHp, name, hpTrackerActive, canPlayersSee, hpOnMap]);

    useEffect(() => {
        if (id) {
            const initTokens = async () => {
                const items = await OBR.scene.items.getItems([id]);
                if (items.length > 0) {
                    const item = items[0];
                    console.log(item.name, characterMetadata in item.metadata);
                    let data: HpTrackerMetadata = {
                        name: item.name,
                        hp: 0,
                        maxHp: 0,
                        hpTrackerActive: false,
                        canPlayersSee: false,
                        hpOnMap: "",
                    };
                    if (characterMetadata in item.metadata) {
                        data = item.metadata[characterMetadata] as HpTrackerMetadata;
                    }
                    setName(data.name !== "" ? data.name : item.name);
                    setHp(data.hp ?? 0);
                    setMaxHp(data.maxHp ?? 0);
                    setHpTrackerActive(data.hpTrackerActive ?? false);
                    setCanPlayersSee(data.canPlayersSee ?? false);
                    setHpOnMap(data.hpOnMap ?? "");
                }
            };
            initTokens();
        }
    }, []);

    const handleAddToMap = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            const item = await createText(`HP:${hp}/${maxHp}`, id ?? "");
            if (item) {
                item.metadata[textMetadata] = { isHpText: true };
                OBR.scene.items.addItems([item]);
                setHpOnMap(item.id);
            }
        } else if (!event.target.checked) {
            OBR.scene.items.deleteItems([hpOnMap as string]);
            setHpOnMap("");
        }
    };

    return (
        <div className={"popover-wrapper"}>
            <label>
                Max HP:
                <input
                    type={"number"}
                    value={maxHp}
                    min={0}
                    onChange={(e) => {
                        setMaxHp(Number(e.target.value));
                    }}
                />
            </label>
            <label>
                HP:
                <input
                    type={"number"}
                    value={hp}
                    max={maxHp}
                    min={0}
                    onChange={(e) => {
                        setHp(Number(e.target.value));
                    }}
                />
            </label>
            <label>
                Name:
                <input
                    type={"text"}
                    value={name}
                    onChange={(e) => {
                        setName(e.target.value);
                    }}
                />
            </label>
            <label>
                Active:
                <input
                    type={"checkbox"}
                    value={String(hpTrackerActive)}
                    checked={hpTrackerActive}
                    onChange={() => {
                        setHpTrackerActive(!hpTrackerActive);
                    }}
                />
            </label>
            <label>
                Visible for Players:
                <input
                    type={"checkbox"}
                    value={String(canPlayersSee)}
                    checked={canPlayersSee}
                    onChange={() => {
                        setCanPlayersSee(!canPlayersSee);
                    }}
                />
            </label>
            <label>
                Add to Map:
                <input
                    type={"checkbox"}
                    value={String(hpOnMap !== "")}
                    checked={hpOnMap !== ""}
                    onChange={(event) => {
                        handleAddToMap(event);
                    }}
                />
            </label>
        </div>
    );
};
