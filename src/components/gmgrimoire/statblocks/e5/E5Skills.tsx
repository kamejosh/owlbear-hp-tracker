import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { FancyLineBreak } from "../../../general/LineBreak.tsx";
import styles from "./statblock-skills.module.scss";
import { capitalize } from "lodash";
import { DiceButton, Stats } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";

const skillToStat = (skillName: string, stats: Stats) => {
    let value = 0;
    if (skillName === "acrobatics") {
        value = stats.dexterity;
    } else if (skillName === "animal_handling") {
        value = stats.wisdom;
    } else if (skillName === "arcana") {
        value = stats.intelligence;
    } else if (skillName === "athletics") {
        value = stats.strength;
    } else if (skillName === "deception") {
        value = stats.charisma;
    } else if (skillName === "history") {
        value = stats.intelligence;
    } else if (skillName === "insight") {
        value = stats.wisdom;
    } else if (skillName === "intimidation") {
        value = stats.charisma;
    } else if (skillName === "investigation") {
        value = stats.intelligence;
    } else if (skillName === "medicine") {
        value = stats.wisdom;
    } else if (skillName === "nature") {
        value = stats.intelligence;
    } else if (skillName === "perception") {
        value = stats.wisdom;
    } else if (skillName === "performance") {
        value = stats.charisma;
    } else if (skillName === "persuasion") {
        value = stats.charisma;
    } else if (skillName === "religion") {
        value = stats.intelligence;
    } else if (skillName === "sleight_of_hand") {
        value = stats.dexterity;
    } else if (skillName === "stealth") {
        value = stats.dexterity;
    } else if (skillName === "survival") {
        value = stats.wisdom;
    }
    return Math.floor((value - 10) / 2);
};

export const E5Skills = () => {
    const { statblock, stats, tokenName, equipmentBonuses } = useE5StatblockContext();

    return (
        <div>
            <h3 className={styles.heading}>Skills</h3>
            <FancyLineBreak />
            <ul className={styles.skills}>
                {statblock.skills
                    ? Object.entries(statblock.skills).map(([skill, value]) => {
                          const combinedValue: number =
                              (value || skillToStat(skill, stats)) +
                              // @ts-ignore statblockBonuses always contain all skills
                              equipmentBonuses.statblockBonuses.skills[skill] +
                              (equipmentBonuses.statblockBonuses.proficiencies.includes(skill)
                                  ? statblock.proficiency_bonus
                                  : 0);
                          return (
                              <li
                                  key={skill}
                                  className={styles.skill}
                                  style={{
                                      background: `linear-gradient(to right, #3f3f3f, transparent  ${(combinedValue / 10) * 100}%)`,
                                  }}
                              >
                                  <b>{capitalize(skill.replaceAll("_", " "))}</b>
                                  <DiceButton
                                      dice={`d20${Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                          Math.floor(combinedValue),
                                      )}`}
                                      text={Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                          Math.floor(combinedValue),
                                      )}
                                      stats={stats}
                                      context={`${capitalize(skill)}: Check`}
                                      statblock={tokenName}
                                      proficiencyBonus={statblock.proficiency_bonus}
                                  />
                              </li>
                          );
                      })
                    : null}
            </ul>
        </div>
    );
};
