import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { LineBreak } from "../../../general/LineBreak.tsx";
import { DiceButton } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize, isNull, isNumber } from "lodash";
import styles from "./statblock-general.module.scss";
import { AC } from "../../Token/AC.tsx";
import { getEquipmentBonuses } from "../../../../helper/equipmentHelpers.ts";

export const E5General = () => {
    const { statblock, stats, tokenName, item } = useE5StatblockContext();
    const equipmentBonuses = getEquipmentBonuses(statblock.stats, statblock.equipment || []);

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
            <LineBreak />
            <ul className={styles.stats}>
                {Object.entries(stats).map(([stat, value]) => {
                    return (
                        <li className={styles.stat} key={stat}>
                            <div className={styles.name}>
                                <span>{stat.substring(0, 3)}</span>
                                <span>{value}</span>
                            </div>
                            <div className={styles.value}>
                                <DiceButton
                                    dice={`d20${Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                        Math.floor((value - 10) / 2),
                                    )}`}
                                    text={Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                        Math.floor((value - 10) / 2),
                                    )}
                                    stats={stats}
                                    context={`${capitalize(stat)}: Check`}
                                    statblock={tokenName}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
            <LineBreak />
            {Object.entries(statblock.saving_throws) ? (
                <>
                    <b>Saving Throws</b>
                    <ul className={styles.savingThrows}>
                        {Object.entries(statblock.saving_throws)
                            .map(([key, value]) => {
                                // @ts-ignore
                                const bonusValue: number = equipmentBonuses.statblockBonuses.savingThrows[key];
                                const combinedValue = (value || 0) + bonusValue;
                                return (
                                    <li className={styles.stat} key={key}>
                                        <div className={styles.name}>
                                            <span>{key.substring(0, 3)}</span>
                                        </div>
                                        <DiceButton
                                            dice={`d20+${combinedValue}`}
                                            text={`+${combinedValue}`}
                                            stats={stats}
                                            context={`${capitalize(key.substring(0, 3))}: Save`}
                                            statblock={tokenName}
                                        />
                                    </li>
                                );
                            })
                            .filter((v) => !!v)}
                    </ul>
                </>
            ) : null}
            <LineBreak />
            <ul className={styles.infos}>
                {statblock.senses ? (
                    <li>
                        <b>Senses:</b> {statblock.senses?.join(", ")}
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
                {statblock.damage_vulnerabilities ? (
                    <li>
                        <b>Damage Vulnerabilities:</b> {statblock.damage_vulnerabilities}
                    </li>
                ) : null}
                {statblock.damage_resistances ? (
                    <li>
                        <b>Damage Resistances:</b> {statblock.damage_resistances}
                    </li>
                ) : null}
                {statblock.damage_immunities ? (
                    <li>
                        <b>Damage Immunities:</b> {statblock.damage_immunities}
                    </li>
                ) : null}
                {statblock.condition_immunities ? (
                    <li>
                        <b>Condition Immunities:</b> {statblock.condition_immunities}
                    </li>
                ) : null}
            </ul>
        </div>
    );
};
