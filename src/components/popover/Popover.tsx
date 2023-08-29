import { ContextWrapper } from "../ContextWrapper.tsx";
import React, { useEffect, useState } from "react";
import { Token } from "../hptracker/Token.tsx";
import OBR from "@owlbear-rodeo/sdk";
import { characterMetadata } from "../../helper/variables.ts";
import { HpTrackerMetadata } from "../../helper/types.ts";
import "./popover.scss";

export const Popover = () => {
    return (
        <ContextWrapper>
            <Content />
        </ContextWrapper>
    );
};

const Content = () => {
    const id = new URLSearchParams(window.location.search).get("id") ?? null;
    const [data, setData] = useState<HpTrackerMetadata | null>(null);

    useEffect(() => {
        const getData = async () => {
            if (id) {
                const items = await OBR.scene.items.getItems([id]);
                if (items.length > 0) {
                    const item = items[0];
                    if (characterMetadata in item.metadata) {
                        setData(item.metadata[characterMetadata] as HpTrackerMetadata);
                    }
                }
            }

            return null;
        };

        OBR.scene.items.onChange(async (items) => {
            const filteredItems = items.filter((item) => item.id === id);
            if (filteredItems.length > 0) {
                const item = filteredItems[0];
                if (characterMetadata in item.metadata) {
                    setData(item.metadata[characterMetadata] as HpTrackerMetadata);
                }
            }
        });

        getData();
    }, []);

    return id && data ? (
        <div className={"popover"}>
            <Token id={id} data={data} popover={true} />
        </div>
    ) : null;
};
