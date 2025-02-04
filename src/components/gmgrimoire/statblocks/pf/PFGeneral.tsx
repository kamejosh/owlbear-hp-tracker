import { FancyLineBreak, LineBreak } from "../../../general/LineBreak.tsx";
import { DiceButton } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize } from "lodash";
import styles from "./statblock-general.module.scss";
import { AC } from "../../Token/AC.tsx";
import { usePFStatblockContext } from "../../../../context/PFStatblockContext.tsx";
import { About } from "../About.tsx";

const statList = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const saveList = ["reflex", "will", "fortitude"];

export const PFGeneral = () => {
    const { statblock, stats, tokenName, item } = usePFStatblockContext();

    return (
        <div className={styles.general}>
            <div className={styles.ac}>
                <b>Armor Class:</b> <AC id={item.id} hideExtras={true} />
                {statblock.armor_class.special ? <span>({statblock.armor_class.special})</span> : null}
            </div>
            <div>
                <b>Speed:</b>
                {` ${statblock.speed}`}
            </div>
            <LineBreak />
            <ul className={styles.stats}>
                <li className={styles.header}>
                    <div></div>
                    <div>Check</div>
                </li>
                {statList.map((name) => {
                    // @ts-ignore name is always in stats
                    const statValue = stats[name];
                    return (
                        <li className={styles.stat} key={name}>
                            <div className={styles.name}>
                                <span>{name.substring(0, 3)}</span>
                            </div>
                            <div className={styles.value}>
                                <DiceButton
                                    dice={`d20+${statValue}`}
                                    text={`+${statValue}`}
                                    stats={stats}
                                    context={`${capitalize(name)}: Check`}
                                    statblock={tokenName}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
            <LineBreak />
            <ul className={styles.savingThrows}>
                <li className={styles.header}>
                    <div></div>
                    <div>Save</div>
                </li>
                {saveList.map((name) => {
                    // @ts-ignore name is always in stats
                    const saveValue = statblock.saving_throws[name];
                    return (
                        <li className={styles.stat} key={name}>
                            <div className={styles.name}>
                                <span>{name.substring(0, 3)}</span>
                            </div>
                            <div className={styles.value}>
                                <DiceButton
                                    dice={`d20+${saveValue}`}
                                    text={`+${saveValue}`}
                                    stats={stats}
                                    context={`${capitalize(name)}: Save`}
                                    statblock={tokenName}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>
            {statblock.saving_throws.special ? <i>{statblock.saving_throws.special}</i> : null}
            <LineBreak />
            {statblock.senses?.length ||
            statblock.languages?.length ||
            statblock.immunities?.length ||
            statblock.weaknesses?.length ||
            statblock.resistances?.length ? (
                <>
                    <ul className={styles.infos}>
                        {statblock.senses?.length ? (
                            <li>
                                <b>Senses:</b> {(statblock.senses || []).join(", ")}
                            </li>
                        ) : null}
                        {statblock.languages?.length ? (
                            <li>
                                <b>Languages:</b> {statblock.languages?.join(", ")}
                            </li>
                        ) : null}
                        {statblock.immunities?.length ? (
                            <li>
                                <b>Immunities:</b> {statblock.immunities.join(", ")}
                            </li>
                        ) : null}
                        {statblock.weaknesses?.length ? (
                            <li>
                                <b>Weaknesses:</b> {statblock.weaknesses.join(", ")}
                            </li>
                        ) : null}
                        {statblock.resistances?.length ? (
                            <li>
                                <b>Resistances:</b> {statblock.resistances.join(", ")}
                            </li>
                        ) : null}
                    </ul>
                    <LineBreak />{" "}
                </>
            ) : null}
            {statblock.traits && statblock.traits.length > 0 ? (
                <>
                    <div>
                        <h3 className={styles.heading}>Traits</h3>
                        <FancyLineBreak />
                        <ul className={styles.traits}>
                            {statblock.traits?.map((trait, index) => {
                                let value = trait.value;
                                if (trait.value.includes(",")) {
                                    value = trait.value.split(",")[0];
                                }
                                return (
                                    <li className={styles.trait} key={index}>
                                        <b>{trait.name}:</b>
                                        <div>{value}</div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <LineBreak />
                </>
            ) : null}
            <About
                slug={statblock.slug}
                about={statblock.about}
                stats={stats}
                statblock={statblock}
                context={statblock.name}
            />
        </div>
    );
};
