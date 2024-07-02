import { components } from "../../../api/schema";
import { DiceButton, DiceButtonWrapper } from "../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize } from "lodash";
import { LimitComponent } from "./LimitComponent.tsx";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import OBR from "@owlbear-rodeo/sdk";
import { itemMetadataKey } from "../../../helper/variables.ts";

export type Ability = components["schemas"]["Action-Output"];

export const E5Ability = ({
    ability,
    statblock,
    tokenData,
    itemId,
}: {
    ability: Ability;
    statblock: string;
    tokenData: HpTrackerMetadata;
    itemId: string;
}) => {
    const limitValues = tokenData.stats.limits?.find((l) => l.id === ability.limit?.name)!;

    const updateLimit = () => {
        OBR.scene.items.updateItems([itemId], (items) => {
            items.forEach((item) => {
                if (item) {
                    const metadata = item.metadata[itemMetadataKey] as HpTrackerMetadata;
                    if (metadata) {
                        const index = metadata.stats.limits?.findIndex((l) => {
                            return l.id === limitValues.id;
                        });
                        if (index !== undefined) {
                            console.log(limitValues);
                            // @ts-ignore
                            item.metadata[itemMetadataKey]["stats"]["limits"][index]["used"] = Math.min(
                                limitValues.used + 1,
                                limitValues.max
                            );
                        }
                    }
                }
            });
        });
    };

    return (
        <li key={ability.name} className={"e5-ability"}>
            <span className={"ability-info"}>
                <b className={"ability-name"}>{ability.name}.</b>
                {ability.limit && tokenData.stats.limits ? (
                    <LimitComponent limit={ability.limit} showTitle={false} limitValues={limitValues} itemId={itemId} />
                ) : null}
            </span>
            <div>
                <DiceButtonWrapper text={ability.desc} context={`${capitalize(ability.name)}`} statblock={statblock} />
            </div>
            <span className={"ability-extra-info"}>
                {ability.attack_bonus ? (
                    <span>
                        <i>Attack bonus</i>:
                        <DiceButton
                            dice={`d20+${ability.attack_bonus}`}
                            text={`+${ability.attack_bonus}`}
                            context={`${capitalize(ability.name)}: To Hit`}
                            statblock={statblock}
                            onRoll={() => {
                                updateLimit();
                            }}
                        />
                    </span>
                ) : null}
                {ability.damage_dice ? (
                    <span>
                        <i>Damage</i>:{" "}
                        <DiceButton
                            dice={ability.damage_dice}
                            text={ability.damage_dice}
                            context={`${capitalize(ability.name)}: Damage`}
                            statblock={statblock}
                            onRoll={
                                !ability.attack_bonus
                                    ? () => {
                                          updateLimit();
                                      }
                                    : undefined
                            }
                        />
                    </span>
                ) : null}
            </span>
        </li>
    );
};
