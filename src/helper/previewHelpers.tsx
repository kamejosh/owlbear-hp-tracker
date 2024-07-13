import { IAvailableDie, IDiceRoll, ITheme } from "dddice-js";
import { D4 } from "../components/svgs/dice/D4.tsx";
import { D6 } from "../components/svgs/dice/D6.tsx";
import { D8 } from "../components/svgs/dice/D8.tsx";
import { D10 } from "../components/svgs/dice/D10.tsx";
import { D12 } from "../components/svgs/dice/D12.tsx";
import { D20 } from "../components/svgs/dice/D20.tsx";

export const getDiceImage = (
    theme: ITheme,
    die: IDiceRoll,
    index: number,
    customTheme?: string,
    themes?: Array<ITheme>
) => {
    if (customTheme && themes) {
        const t = themes.find((th) => th.id === customTheme);
        if (t) {
            theme = t;
        }
    }
    const themeDie = theme.available_dice.find(
        (d) => d.hasOwnProperty("type") && (d as IAvailableDie).type === die.type
    );
    if (themeDie) {
        let preview = "";
        const notation = (themeDie as IAvailableDie).notation;
        const id = (themeDie as IAvailableDie).id;
        if (theme.preview.hasOwnProperty(id)) {
            preview = theme.preview[id];
        } else if (notation && theme.preview.hasOwnProperty(notation)) {
            preview = theme.preview[notation];
        }
        if (preview) {
            return <img key={index} className={"preview-image"} src={preview} alt={die.type} />;
        }
    } else if (theme.preview.hasOwnProperty(die.type)) {
        return <img key={index} className={"preview-image"} src={theme.preview[die.type]} alt={die.type} />;
    }
};

export const getSvgForDiceType = (diceType: string) => {
    if (diceType === "d4") {
        return <D4 />;
    } else if (diceType === "d6") {
        return <D6 />;
    } else if (diceType === "d8") {
        return <D8 />;
    } else if (diceType === "d10" || diceType === "d10x") {
        return <D10 />;
    } else if (diceType === "d12") {
        return <D12 />;
    } else {
        return <D20 />;
    }
};
