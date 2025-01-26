import { components } from "../../../../api/schema";
import { useState } from "react";
import { DiceButtonWrapper, Stats } from "../../../general/DiceRoller/DiceButtonWrapper.tsx";
import { capitalize, isString } from "lodash";

export type Action = components["schemas"]["ActionOut"];
export type Reaction = components["schemas"]["Reaction-Output"];
export type SpecialAbility = components["schemas"]["SpecialAbility-Output"];

export const PfAbility = ({
    ability,
    statblock,
    stats,
}: {
    ability: Action | Reaction | SpecialAbility;
    statblock: string;
    stats: Stats;
}) => {
    const [open, setOpen] = useState<boolean>(false);

    const entries = Object.entries(ability);
    const hasDetails = (): boolean => {
        let has = false;
        entries.forEach((entry) => {
            const [key, value] = entry;
            if (!["name", "type", "description", "value"].includes(key) && value) {
                has = true;
            }
        });
        return has;
    };

    const actionTypeConvert = (ability: Action | Reaction | SpecialAbility) => {
        let actionType = "";
        if (Object.keys(ability).includes("type")) {
            const action = ability as Action;
            if (action.type === "ONE") {
                actionType = "(one action)";
            } else if (action.type === "TWO") {
                actionType = "(two actions)";
            } else if (action.type === "THREE") {
                actionType = "(three actions)";
            } else if (action.type === "FREE") {
                actionType = "(free action)";
            } else {
                return "";
            }
            return <span className={"action-type"}>{actionType}</span>;
        }

        return "";
    };

    const isAction = (ability: Action | Reaction | SpecialAbility) => {
        if (Object.keys(ability).includes("type")) {
            return true;
        }
        return false;
    };

    return (
        <div key={ability.name} className={`pf-ability ${open ? "open" : ""}`}>
            <div className={"main-info"}>
                <div className={"name-and-description"}>
                    <b className={"ability-name"}>{ability.name}</b> {actionTypeConvert(ability)}
                    {Object.keys(ability).includes("description") && (ability as Action).description !== "" ? (
                        <div className={`ability-description ${isAction(ability) ? "action" : "ability"}`}>
                            <DiceButtonWrapper
                                text={(ability as Action).description!}
                                context={`${capitalize(ability.name)}`}
                                statblock={statblock}
                                stats={stats}
                            />
                        </div>
                    ) : null}
                </div>
                {hasDetails() ? (
                    <button className={`expand ${open ? "open" : ""}`} onClick={() => setOpen(!open)}></button>
                ) : null}
            </div>

            <div className={`action-details-wrapper  ${open ? "open" : null}`}>
                <ul className={`action-details`}>
                    {Object.entries(ability).map(([key, value], index) => {
                        if (
                            value !== null &&
                            value !== "" &&
                            isString(value) &&
                            !["name", "type", "description", "value", "limit"].includes(key)
                        ) {
                            return (
                                <li key={index}>
                                    <b>{key}</b>:{" "}
                                    <DiceButtonWrapper
                                        text={value}
                                        stats={stats}
                                        context={`${capitalize(ability.name)}: ${capitalize(key)}`}
                                        statblock={statblock}
                                        damageDie={key === "damage"}
                                    />
                                </li>
                            );
                        }
                    })}
                </ul>
            </div>
        </div>
    );
};
