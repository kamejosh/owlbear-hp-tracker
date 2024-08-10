import { useMetadataContext } from "../../../../context/MetadataContext.ts";
import { useE5GetStatblock } from "../../../../api/e5/useE5Api.ts";
import { useTokenListContext } from "../../../../context/TokenContext.tsx";
import { HpTrackerMetadata } from "../../../../helper/types.ts";
import { DiceButton } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize, isNull } from "lodash";
import { About } from "../About.tsx";
import { LimitComponent } from "../LimitComponent.tsx";
import { E5Ability } from "./E5Ability.tsx";
import { E5Spells } from "./E5Spells.tsx";
import { HP } from "../../Token/HP.tsx";
import { AC } from "../../Token/AC.tsx";

export const E5StatBlock = ({ slug, itemId }: { slug: string; itemId: string }) => {
    const room = useMetadataContext((state) => state.room);
    const statblockQuery = useE5GetStatblock(slug, room?.tabletopAlmanacAPIKey);
    const statblock = statblockQuery.isSuccess && statblockQuery.data ? statblockQuery.data : null;
    const token = useTokenListContext((state) => state.tokens?.get(itemId));
    const data = token?.data as HpTrackerMetadata;

    return statblock ? (
        <div className={"open5e-sheet"}>
            <div className={"what"}>
                <h3>{statblock.name}</h3>
                <span>
                    {statblock.size} {statblock.type} {statblock.subtype ? `, ${statblock.subtype}` : null}
                    {statblock.alignment ? `, ${statblock.alignment}` : null}
                    {statblock.group ? `, ${statblock.group}` : null}
                </span>
            </div>
            <div className={"values"}>
                <span className={"ac"}>
                    <b>Armor Class</b> <AC id={itemId} />
                    {!!statblock.armor_class.special ? `(${statblock.armor_class.special})` : null}
                </span>
                <span className={"hp"}>
                    <b>Hit Points</b> <HP id={itemId} />
                    {statblock.hp.hit_dice ? (
                        <DiceButton
                            dice={statblock.hp.hit_dice}
                            text={statblock.hp.hit_dice}
                            context={data.name + ": Hit Dice"}
                            statblock={data.name}
                        />
                    ) : null}
                </span>
                <span className={"speed"}>
                    <b>Speed</b>{" "}
                    {Object.entries(statblock.speed)
                        .map(([key, value]) => {
                            if (value) {
                                return `${key} ${value}`;
                            }
                            return null;
                        })
                        .filter((v) => !!v)
                        .join(", ")}
                </span>
            </div>
            <div className={"stats"}>
                {Object.entries(statblock.stats).map(([stat, value]) => {
                    return (
                        <div className={"stat"} key={stat}>
                            <div className={"stat-name"}>{stat.substring(0, 3)}</div>
                            <div className={"stat-value"}>
                                {value}
                                <DiceButton
                                    dice={`d20${Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                        Math.floor((value - 10) / 2)
                                    )}`}
                                    text={Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                        Math.floor((value - 10) / 2)
                                    )}
                                    context={`${capitalize(stat)}: Check`}
                                    statblock={data.name}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className={"tidbits"}>
                {Object.entries(statblock.saving_throws).filter((st) => !!st[1]).length > 0 ? (
                    <div className={"tidbit saving-throws"}>
                        <div className={"bold"}>Saving Throws</div>
                        <div className={"saving-throw-list"}>
                            {Object.entries(statblock.saving_throws)
                                .map(([key, value]) => {
                                    if (!isNull(value)) {
                                        return (
                                            <span className={"saving-throw"} key={key}>
                                                {key.substring(0, 3)}:{" "}
                                                <DiceButton
                                                    dice={`d20+${value}`}
                                                    text={`+${value}`}
                                                    context={`${capitalize(key.substring(0, 3))}: Save`}
                                                    statblock={data.name}
                                                />
                                            </span>
                                        );
                                    }
                                })
                                .filter((v) => !!v)}
                        </div>
                    </div>
                ) : null}
                <div className={"tidbit"}>
                    <b>Senses</b> {statblock.senses?.join(", ")}
                </div>
                <div className={"tidbit"}>
                    <b>Languages</b> {statblock.languages?.join(", ")}
                </div>
                <div className={"tidbit"}>
                    <b>Items</b> {statblock.items?.join(", ")}
                </div>
                <div className={"tidbit"}>
                    <b>Challenge</b> {statblock.challenge_rating}
                </div>
            </div>
            <About about={statblock.about} slug={slug} />
            {statblock.skills && Object.entries(statblock.skills).filter(([_, value]) => !!value).length > 0 ? (
                <div className={"skills"}>
                    <h3>Skills</h3>
                    <ul className={"skill-list"}>
                        {Object.entries(statblock.skills).map(([key, value], index) => {
                            if (!isNull(value)) {
                                return (
                                    <li className={"skill"} key={index}>
                                        <b>{key}</b>:{" "}
                                        <DiceButton
                                            dice={`d20${Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                                Math.floor(value)
                                            )}`}
                                            text={Intl.NumberFormat("en-US", { signDisplay: "always" }).format(
                                                Math.floor(value)
                                            )}
                                            context={`${capitalize(key)}: Check`}
                                            statblock={data.name}
                                        />
                                    </li>
                                );
                            }
                        })}
                    </ul>
                </div>
            ) : null}
            {statblock.damage_vulnerabilities ||
            statblock.damage_resistances ||
            statblock.damage_immunities ||
            statblock.condition_immunities ? (
                <div className={"resistances"}>
                    {statblock.damage_vulnerabilities ? (
                        <>
                            <h3>Damage Vulnerabilities</h3> {statblock.damage_vulnerabilities}
                        </>
                    ) : null}
                    {statblock.damage_resistances ? (
                        <>
                            <h3>Damage Resistances</h3> {statblock.damage_resistances}
                        </>
                    ) : null}
                    {statblock.damage_immunities ? (
                        <>
                            <h3>Damage Immunities</h3> {statblock.damage_immunities}
                        </>
                    ) : null}
                    {statblock.condition_immunities ? (
                        <>
                            <h3>Condition Immunities</h3> {statblock.condition_immunities}
                        </>
                    ) : null}
                </div>
            ) : null}
            {statblock.limits && statblock.limits.length > 0 ? (
                <div className={"limits"}>
                    {statblock.limits.map((limit, i) => {
                        const limitValues = data.stats.limits?.find((l) => l.id === limit!.name);
                        return limitValues ? (
                            <LimitComponent
                                key={i}
                                limit={limit}
                                title={"name"}
                                limitValues={data.stats.limits?.find((l) => l.id === limit!.name)!}
                                itemId={itemId}
                            />
                        ) : null;
                    })}
                </div>
            ) : null}
            {statblock.special_abilities && statblock.special_abilities.length > 0 ? (
                <div className={"special-abilities"}>
                    <h3>Special Abilities</h3>
                    <ul className={"ability-list"}>
                        {statblock.special_abilities?.map((ability, index) => (
                            <E5Ability
                                ability={ability}
                                key={ability.name + index}
                                statblock={data.name}
                                tokenData={data}
                                itemId={itemId}
                            />
                        ))}
                    </ul>
                </div>
            ) : null}
            {statblock.actions && statblock.actions.length > 0 ? (
                <div className={"actions"}>
                    <h3>Actions</h3>
                    <ul className={"ability-list"}>
                        {statblock.actions.map((action, index) => (
                            <E5Ability
                                ability={action}
                                key={action.name + index}
                                statblock={data.name}
                                tokenData={data}
                                itemId={itemId}
                            />
                        ))}
                    </ul>
                </div>
            ) : null}
            {statblock.reactions && statblock.reactions.length > 0 ? (
                <div className={"reactions"}>
                    <h3>Reactions</h3>
                    <ul className={"ability-list"}>
                        {statblock.reactions?.map((reaction, index) => (
                            <E5Ability
                                ability={reaction}
                                key={reaction.name + index}
                                statblock={data.name}
                                tokenData={data}
                                itemId={itemId}
                            />
                        ))}
                    </ul>
                </div>
            ) : null}
            {statblock.bonus_actions && statblock.bonus_actions.length > 0 ? (
                <div className={"bonus-actions"}>
                    <h3>Bonus Actions</h3>
                    <ul className={"ability-list"}>
                        {statblock.bonus_actions.map((action, index) => (
                            <E5Ability
                                ability={action}
                                key={action.name + index}
                                statblock={data.name}
                                tokenData={data}
                                itemId={itemId}
                            />
                        ))}
                    </ul>
                </div>
            ) : null}
            {statblock.lair_actions && statblock.lair_actions.length > 0 ? (
                <div className={"lair-actions"}>
                    <h3>Lair Actions</h3>
                    <ul className={"ability-list"}>
                        {statblock.lair_actions.map((action, index) => (
                            <E5Ability
                                ability={action}
                                key={action.name + index}
                                statblock={data.name}
                                tokenData={data}
                                itemId={itemId}
                            />
                        ))}
                    </ul>
                </div>
            ) : null}
            {statblock.mythic_actions && statblock.mythic_actions.length > 0 ? (
                <div className={"mythic-actions"}>
                    <h3>Mythic Actions</h3>
                    <ul className={"ability-list"}>
                        {statblock.mythic_actions.map((action, index) => (
                            <E5Ability
                                ability={action}
                                key={action.name + index}
                                statblock={data.name}
                                tokenData={data}
                                itemId={itemId}
                            />
                        ))}
                    </ul>
                </div>
            ) : null}
            {(statblock.legendary_actions && statblock.legendary_actions.length > 0) || !!statblock.legendary_desc ? (
                <div className={"legendary-actions"}>
                    <h3>Legendary Actions</h3>
                    {statblock.legendary_desc}
                    <ul className={"ability-list"}>
                        {statblock.legendary_actions?.map((legendary_action, index) => (
                            <E5Ability
                                ability={legendary_action}
                                key={legendary_action.name + index}
                                statblock={data.name}
                                tokenData={data}
                                itemId={itemId}
                            />
                        ))}
                    </ul>
                </div>
            ) : null}
            {statblock.spell_slots && statblock.spell_slots.length > 0 ? (
                <div className={"spell-slots"}>
                    <h3>Spell Slots</h3>
                    <div className={"spell-slot-limits"}>
                        {statblock.spell_slots
                            .sort((a, b) => a.level - b.level)
                            .map((spellSlot, i) => {
                                const limitValues = data.stats.limits?.find((l) => l.id === spellSlot.limit!.name);
                                return limitValues ? (
                                    <div className={"spell-slot-entry"} key={i}>
                                        <div className={"spell-slot-level"}>Level: {spellSlot.level}</div>
                                        <LimitComponent
                                            limit={spellSlot.limit}
                                            title={"none"}
                                            hideReset={true}
                                            limitValues={limitValues}
                                            itemId={itemId}
                                        />
                                    </div>
                                ) : null;
                            })}
                    </div>
                </div>
            ) : null}
            {statblock.spells && statblock.spells.length > 0 ? (
                <E5Spells
                    spells={statblock.spells}
                    statblock={data.name}
                    spellSlots={statblock.spell_slots}
                    tokenData={data}
                    itemId={itemId}
                    dc={statblock.spell_dc}
                    attack={statblock.spell_attack}
                />
            ) : null}
        </div>
    ) : null;
};
