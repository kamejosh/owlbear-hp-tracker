import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { FancyLineBreak } from "../../../general/LineBreak.tsx";
import styles from "./statblock-skills.module.scss";
import { capitalize } from "lodash";
import { DiceButton } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";

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
                              value +
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
