import { createContext, useContext } from "react";
import { ThreeDDice } from "dddice-js";

export type DDDiceContextType = {
    dice: ThreeDDice | undefined;
};

export const DiceContext = createContext<DDDiceContextType | undefined>(undefined);

export const useDiceContext = (): DDDiceContextType => {
    const diceContext = useContext(DiceContext);
    if (diceContext === undefined) {
        throw new Error("DDDice not ready");
    }

    return diceContext;
};
