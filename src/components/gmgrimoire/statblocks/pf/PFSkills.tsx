import { FancyLineBreak } from "../../../general/LineBreak.tsx";
import styles from "./statblock-skills.module.scss";
import { capitalize } from "lodash";
import { DiceButton } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { usePFStatblockContext } from "../../../../context/PFStatblockContext.tsx";

export const PFSkills = () => {
    const { statblock, stats, tokenName } = usePFStatblockContext();

    return (
        <div>
            <h3 className={styles.heading}>Skills</h3>
            <FancyLineBreak />
            <ul className={styles.skills}>
                {statblock.skills?.map((skill, index) => {
                    let skillValue = 0;
                    try {
                        skillValue = parseInt(skill.value);
                    } catch {}
                    return (
                        <li
                            key={index}
                            className={styles.skill}
                            style={{
                                background: `linear-gradient(to right, #3f3f3f, transparent  ${(skillValue / 30) * 100}%)`,
                            }}
                        >
                            <b>{capitalize(skill.name.replaceAll("_", " "))}</b>
                            <DiceButton
                                dice={`d20+${skillValue}`}
                                text={Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                    Math.floor(skillValue),
                                )}
                                stats={stats}
                                context={`${capitalize(skill.name)}: Check`}
                                statblock={tokenName}
                            />
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};
