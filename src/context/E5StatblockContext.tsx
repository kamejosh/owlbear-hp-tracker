import { Stats } from "../components/general/DiceRoller/DiceButtonWrapper.tsx";
import { GMGMetadata } from "../helper/types.ts";
import { Image } from "@owlbear-rodeo/sdk";
import { createContext, PropsWithChildren, useContext } from "react";
import { useTokenListContext } from "./TokenContext.tsx";
import { useShallow } from "zustand/react/shallow";
import { getTokenName } from "../helper/helpers.ts";
import { E5Statblock } from "../api/e5/useE5Api.ts";
import { Loader } from "../components/general/Loader.tsx";
import { EquipmentBonuses, getEquipmentBonuses } from "../helper/equipmentHelpers.ts";

export type E5StatblockContextType = {
    stats: Stats;
    tokenName: string;
    data: GMGMetadata;
    item: Image;
    statblock: E5Statblock;
    equipmentBonuses: EquipmentBonuses;
};

export const E5StatblockContext = createContext<E5StatblockContextType | null>(null);

export const useE5StatblockContext = (): E5StatblockContextType => {
    const e5StatblockContext = useContext(E5StatblockContext);
    if (e5StatblockContext === null) {
        throw new Error("E5StatblockContext is not set");
    }
    return e5StatblockContext;
};

export const E5StatblockContextProvider = (props: PropsWithChildren & { itemId: string; statblock: E5Statblock }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(props.itemId)));

    if (token) {
        const data = token.data;
        const item = token.item;
        const equipmentBonuses = getEquipmentBonuses(data, props.statblock.stats, props.statblock.equipment || []);
        return (
            <E5StatblockContext.Provider
                value={{
                    tokenName: getTokenName(item),
                    data: data,
                    item: item,
                    statblock: props.statblock,
                    stats: {
                        strength: equipmentBonuses.stats.strength,
                        dexterity: equipmentBonuses.stats.dexterity,
                        constitution: equipmentBonuses.stats.constitution,
                        wisdom: equipmentBonuses.stats.wisdom,
                        intelligence: equipmentBonuses.stats.intelligence,
                        charisma: equipmentBonuses.stats.charisma,
                    },
                    equipmentBonuses: equipmentBonuses,
                }}
            >
                {props.children}
            </E5StatblockContext.Provider>
        );
    }

    return <Loader />;
};
