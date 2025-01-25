import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { LineBreak } from "../../../general/LineBreak.tsx";
import { DiceButton } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize, isNull } from "lodash";
import styles from "./statblock-general.module.scss";
import { AC } from "../../Token/AC.tsx";

const statList = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

export const E5General = () => {
    const { statblock, stats, tokenName, item, equipmentBonuses } = useE5StatblockContext();

    return (
        <div>
            <div className={styles.ac}>
                <b>Armor Class:</b> <AC id={item.id} hideExtras={true} />
                {statblock.armor_class.special ? <span>({statblock.armor_class.special})</span> : null}
            </div>
            <div>
                <b>Speed:</b>{" "}
                {Object.entries(statblock.speed)
                    .map(([key, value]) => {
                        if (key !== "notes") {
                            // @ts-ignore
                            const bonusValue = equipmentBonuses.statblockBonuses.speed[key];
                            if (value || bonusValue) {
                                return `${key} ${value + bonusValue} ft.`;
                            }
                        }
                        return null;
                    })
                    .filter((v) => !!v)
                    .join(", ")}
            </div>
            {statblock.proficiency_bonus ? (
                <div>
                    <b>Proficiency Bonus:</b> {statblock.proficiency_bonus}
                </div>
            ) : null}
            <LineBreak />
            <ul className={styles.stats}>
                <li className={styles.header}>
                    <div></div>
                    <div>Check</div>
                    <div>Save</div>
                </li>
                {statList.map((name) => {
                    const savingThrowKey = `${name}_save`;
                    // @ts-ignore name is always in stats
                    const statValue = equipmentBonuses.stats[name];
                    // @ts-ignore name is always in stats
                    const saveValue = Object.hasOwn(statblock.stats, savingThrowKey)
                        ? // @ts-ignore
                          statblock.stats[savingThrowKey]
                        : // @ts-ignore
                          0 + equipmentBonuses.statblockBonuses.savingThrows[savingThrowKey];
                    return (
                        <li className={styles.stat} key={name}>
                            <div className={styles.name}>
                                <span>{name.substring(0, 3)}</span>
                                <span>{statValue}</span>
                            </div>
                            <div className={styles.value}>
                                <DiceButton
                                    dice={`d20${Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                        Math.floor((statValue - 10) / 2),
                                    )}`}
                                    text={Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                        Math.floor((statValue - 10) / 2),
                                    )}
                                    stats={stats}
                                    context={`${capitalize(name)}: Check`}
                                    statblock={tokenName}
                                />
                                <DiceButton
                                    dice={`d20+${saveValue}`}
                                    text={`+${saveValue}`}
                                    stats={stats}
                                    context={`${capitalize(name.substring(0, 3))}: Save`}
                                    statblock={tokenName}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
            <LineBreak />
            <ul className={styles.infos}>
                {statblock.senses || equipmentBonuses.statblockBonuses.senses ? (
                    <li>
                        <b>Senses:</b>{" "}
                        {(statblock.senses || []).concat(...equipmentBonuses.statblockBonuses.senses).join(", ")}
                    </li>
                ) : null}
                <li>
                    <b>Languages:</b> {statblock.languages?.join(", ")}
                </li>
                {statblock.challenge_rating || !isNull(statblock.cr) ? (
                    <li>
                        <b>Challenge:</b> {statblock.cr}{" "}
                        {statblock.challenge_rating ? `(${statblock.challenge_rating})` : null}
                    </li>
                ) : null}
                {statblock.damage_vulnerabilities || equipmentBonuses.statblockBonuses.damageVulnerabilities ? (
                    <li>
                        <b>Damage Vulnerabilities:</b> {statblock.damage_vulnerabilities}{" "}
                        {equipmentBonuses.statblockBonuses.damageVulnerabilities}
                    </li>
                ) : null}
                {statblock.damage_resistances || equipmentBonuses.statblockBonuses.damageResistances ? (
                    <li>
                        <b>Damage Resistances:</b> {statblock.damage_resistances}{" "}
                        {equipmentBonuses.statblockBonuses.damageResistances}
                    </li>
                ) : null}
                {statblock.damage_immunities || equipmentBonuses.statblockBonuses.damageImmunities ? (
                    <li>
                        <b>Damage Immunities:</b> {statblock.damage_immunities}{" "}
                        {equipmentBonuses.statblockBonuses.damageResistances}
                    </li>
                ) : null}
                {statblock.condition_immunities || equipmentBonuses.statblockBonuses.conditionImmunities ? (
                    <li>
                        <b>Condition Immunities:</b> {statblock.condition_immunities}{" "}
                        {equipmentBonuses.statblockBonuses.conditionImmunities}
                    </li>
                ) : null}
            </ul>
        </div>
    );
};
