import { useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { LineBreak } from "../../../general/LineBreak.tsx";
import { DiceButton } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize, isNull } from "lodash";
import styles from "./statblock-general.module.scss";
import { AC } from "../../Token/AC.tsx";
import { About } from "../About.tsx";
import { LimitComponent, LimitType } from "../LimitComponent.tsx";
import { updateLimit } from "../../../../helper/helpers.ts";
import { updateHp } from "../../../../helper/hpHelpers.ts";
import { updateTokenMetadata } from "../../../../helper/tokenHelper.ts";

const statList = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];

export const E5General = () => {
    const { statblock, stats, tokenName, item, equipmentBonuses, data } = useE5StatblockContext();
    const hitDice = data.stats.limits?.find((l) => l.id === "Hit Dice");
    let hitDiceLimit: LimitType | null = null;
    let hitDiceText: string | null = null;
    if (statblock.hp.hit_dice) {
        try {
            hitDiceLimit = {
                name: "Hit Dice",
                uses: Number(statblock.hp.hit_dice.split("d")[0]),
                resets: ["Long Rest"],
            };
            hitDiceText = statblock.hp.hit_dice.split("d")[1].split("+")[0];
        } catch {}
    }

    return (
        <div className={styles.general}>
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
            {hitDiceLimit && hitDice && hitDiceText ? (
                <div className={styles.hitDiceWrapper}>
                    <h3 className={styles.hitDice}>Hit Dice</h3>
                    <LimitComponent
                        limit={hitDiceLimit}
                        title={"uses"}
                        limitValues={hitDice}
                        itemId={item.id}
                        hideReset={true}
                    />
                    <div className={"dice-button-wrapper"}>
                        <DiceButton
                            dice={`1d${hitDiceText}+CON`}
                            text={`1d${hitDiceText}+CON`}
                            context={"Hit Dice"}
                            stats={stats}
                            statblock={tokenName}
                            onRoll={async (rollResult) => {
                                let heal = 0;
                                try {
                                    if (rollResult && "total" in rollResult) {
                                        heal = rollResult.total;
                                    } else if (rollResult && "values" in rollResult) {
                                        heal = rollResult.values.map((v) => v.value).reduce((a, b) => a + b, 0);
                                    }
                                } catch {}
                                if (heal) {
                                    const newData = { ...data, hp: Math.min(data.hp + heal, data.maxHp) };
                                    await updateHp(item, newData);
                                    await updateTokenMetadata(newData, [item.id]);
                                }
                                await updateLimit(item.id, hitDice);
                            }}
                            limitReached={hitDiceLimit.uses === hitDice.used}
                            proficiencyBonus={statblock.proficiency_bonus}
                        />
                    </div>
                    <LineBreak />
                </div>
            ) : null}
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
                    const statBonus = Math.floor((statValue - 10) / 2);
                    // @ts-ignore
                    const saveBonus = statblock.saving_throws[savingThrowKey] || statBonus;
                    // @ts-ignore name is always in stats
                    const saveValue = Object.hasOwn(equipmentBonuses.statblockBonuses.savingThrows, savingThrowKey)
                        ? saveBonus +
                          // @ts-ignore
                          equipmentBonuses.statblockBonuses.savingThrows[savingThrowKey]
                        : saveBonus;

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
                                    proficiencyBonus={statblock.proficiency_bonus}
                                />
                                <DiceButton
                                    dice={`d20${Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                        Math.floor(saveValue),
                                    )}`}
                                    text={Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                        Math.floor(saveValue),
                                    )}
                                    stats={stats}
                                    context={`${capitalize(name.substring(0, 3))}: Save`}
                                    statblock={tokenName}
                                    proficiencyBonus={statblock.proficiency_bonus}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
            <LineBreak />
            {statblock.limits && statblock.limits.length > 0 ? (
                <div>
                    <h3 className={styles.hitDice}>Limits</h3>
                    {statblock.limits.map((limit, i) => {
                        const limitValues = data.stats.limits?.find((l) => l.id === limit!.name);
                        return limitValues ? (
                            <div key={i}>
                                <LimitComponent
                                    limit={limit}
                                    title={"name"}
                                    limitValues={data.stats.limits?.find((l) => l.id === limit!.name)!}
                                    itemId={item.id}
                                />
                                <LineBreak />
                            </div>
                        ) : null;
                    })}
                </div>
            ) : null}
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
            <LineBreak />
            <About
                about={statblock.about}
                slug={statblock.slug}
                statblock={statblock}
                stats={stats}
                context={statblock.name}
            />
        </div>
    );
};
