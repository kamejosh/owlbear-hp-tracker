import { Stats } from "../components/general/DiceRoller/DiceButtonWrapper.tsx";
import { GMGMetadata } from "../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { createContext, PropsWithChildren, useContext } from "react";
import { useTokenListContext } from "./TokenContext.tsx";
import { useShallow } from "zustand/react/shallow";
import { getTokenName } from "../helper/helpers.ts";
import { Loader } from "../components/general/Loader.tsx";
import { PfStatblock } from "../api/pf/usePfApi.ts";

export type PFStatblockContextType = {
    stats: Stats;
    tokenName: string;
    data: GMGMetadata;
    item: Image;
    statblock: PfStatblock;
};

export const PFStatblockContext = createContext<PFStatblockContextType | null>(null);

export const usePFStatblockContext = (): PFStatblockContextType => {
    const pfStatblockContext = useContext(PFStatblockContext);
    if (pfStatblockContext === null) {
        throw new Error("PFStatblockContext is not set");
    }
    return pfStatblockContext;
};

export const PFStatblockContextProvider = (props: PropsWithChildren & { itemId: string; statblock: PfStatblock }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(props.itemId)));

    if (token) {
        const data = token.data;
        const item = token.item;
        return (
            <PFStatblockContext.Provider
                value={{
                    tokenName: getTokenName(item),
                    data: data,
                    item: item,
                    statblock: props.statblock,
                    stats: {
                        strength: props.statblock.stats.strength || 0,
                        dexterity: props.statblock.stats.dexterity || 0,
                        constitution: props.statblock.stats.constitution || 0,
                        wisdom: props.statblock.stats.wisdom || 0,
                        intelligence: props.statblock.stats.intelligence || 0,
                        charisma: props.statblock.stats.charisma || 0,
                    },
                }}
            >
                {props.children}
            </PFStatblockContext.Provider>
        );
    }

    return <Loader />;
};
