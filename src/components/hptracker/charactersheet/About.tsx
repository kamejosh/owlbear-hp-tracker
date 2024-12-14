import { useLocalStorage } from "../../../helper/hooks.ts";
import { ID } from "../../../helper/variables.ts";
import { DiceButtonWrapper } from "../../general/DiceRoller/DiceButtonWrapper.tsx";
import { E5Statblock } from "../../../api/e5/useE5Api.ts";
import { PfStatblock } from "../../../api/pf/usePfApi.ts";

export const About = ({
    about,
    slug,
    statblock,
}: {
    about?: string | null;
    slug: string;
    statblock: E5Statblock | PfStatblock;
}) => {
    const [open, setOpen] = useLocalStorage<boolean>(`${ID}.about.${slug}`, false);
    return about ? (
        <div className={"about"}>
            <h3>About</h3>
            <button className={`expand ${open ? "open" : null}`} onClick={() => setOpen(!open)}></button>
            <div className={`about-content-wrapper ${open ? "open" : "hidden"}`}>
                <div className={"about-content"}>
                    <DiceButtonWrapper text={about} context={""} statblock={statblock.name} stats={statblock.stats} />
                </div>
            </div>
        </div>
    ) : null;
};
