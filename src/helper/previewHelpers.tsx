import { IAvailableDie, ITheme } from "dddice-js";
import { D4 } from "../components/svgs/dice/D4.tsx";
import { D6 } from "../components/svgs/dice/D6.tsx";
import { D8 } from "../components/svgs/dice/D8.tsx";
import { D10 } from "../components/svgs/dice/D10.tsx";
import { D12 } from "../components/svgs/dice/D12.tsx";
import { D20 } from "../components/svgs/dice/D20.tsx";

export const getDiceImage = (
    theme: ITheme,
    dieType: string,
    index: number,
    customTheme?: string,
    themes?: Array<ITheme> | null,
) => {
    if (customTheme && themes) {
        const t = themes.find((th) => th.id === customTheme);
        if (t) {
            theme = t;
        }
    }
    const themeDie = theme.available_dice.find(
        (d) => d.hasOwnProperty("type") && (d as IAvailableDie).type === dieType,
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
            return <img key={index} className={"preview-image"} src={preview} alt={dieType} />;
        }
    } else if (theme.preview.hasOwnProperty(dieType)) {
        return <img key={index} className={"preview-image"} src={theme.preview[dieType]} alt={dieType} />;
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

export const getThemePreview = (t: ITheme) => {
    if (t?.preview) {
        if (Object.keys(t.preview).includes("d20")) {
            return <img className={"theme-preview"} src={t.preview.d20} alt={"d20 theme preview"} />;
        } else if (Object.keys(t.preview).length > 0) {
            return <img className={"theme-preview"} src={Object.values(t.preview).pop()} alt={"theme preview"} />;
        }
    }
    return <img className={"theme-preview"} src={""} alt={"no preview available"} />;
};
