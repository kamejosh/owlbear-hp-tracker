import { useLocalStorage } from "../../../helper/hooks.ts";
import { ID } from "../../../helper/variables.ts";
import { DiceButtonWrapper, Stats } from "../../general/DiceRoller/DiceButtonWrapper.tsx";
import { E5Statblock } from "../../../api/e5/useE5Api.ts";
import { PfStatblock } from "../../../api/pf/usePfApi.ts";
import { useMetadataContext } from "../../../context/MetadataContext.ts";

export const About = ({
    about,
    slug,
    statblock,
    stats,
    context,
    defaultOpen,
    hideTitle,
}: {
    about?: string | null;
    slug: string;
    statblock?: E5Statblock | PfStatblock;
    stats?: Stats;
    context?: string;
    defaultOpen?: boolean;
    hideTitle?: boolean;
}) => {
    const room = useMetadataContext.getState().room;
    const [open, setOpen] = useLocalStorage<boolean>(`${ID}.about.${slug}`, !!defaultOpen);
    return about ? (
        <div className={`about ${hideTitle ? "no-title" : ""}`}>
            {!hideTitle ? <h3>About</h3> : null}
            <button className={`expand ${open ? "open" : null}`} onClick={() => setOpen(!open)}></button>
            <div className={`about-content-wrapper ${open ? "open" : "hidden"}`}>
                <div className={"about-content"}>
                    <DiceButtonWrapper
                        text={about}
                        context={context || statblock?.name || "Custom Roll"}
                        statblock={statblock?.name}
                        stats={
                            stats || {
                                strength: statblock?.stats.strength || 0,
                                dexterity: statblock?.stats.dexterity || 0,
                                constitution: statblock?.stats.constitution || 0,
                                intelligence: statblock?.stats.intelligence || 0,
                                wisdom: statblock?.stats.wisdom || 0,
                                charisma: statblock?.stats.charisma || 0,
                            }
                        }
                        proficiencyBonus={room?.ruleset === "e5" ? (statblock as E5Statblock).proficiency_bonus : null}
                    />
                </div>
            </div>
        </div>
    ) : null;
};
