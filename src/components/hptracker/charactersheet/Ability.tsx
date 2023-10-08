import { components } from "../../../ttrpgapi/schema";
import "./ability.scss";
import { useState } from "react";

type Action = components["schemas"]["app__models__pathfinder__Action-Output"];
type Reaction = components["schemas"]["Reaction-Output"];
type SpecialAbility = components["schemas"]["SpecialAbility"];

export const Ability = ({ ability }: { ability: Action | Reaction | SpecialAbility }) => {
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

    return (
        <li key={ability.name} className={`ability ${open ? "open" : ""}`}>
            <div className={"main-info"}>
                <b>{ability.name}</b> ({Object.keys(ability).includes("type") ? (ability as Action).type : ""}):{" "}
                {Object.keys(ability).includes("description") ? (ability as Action).description : ""}
                {hasDetails() ? (
                    <button className={`expand ${open ? "open" : ""}`} onClick={() => setOpen(!open)}></button>
                ) : null}
            </div>
            {open ? (
                <ul className={"action-details"}>
                    {Object.entries(ability).map(([key, value], index) => {
                        if (value !== null && value !== "" && !["name", "type", "description", "value"].includes(key)) {
                            return (
                                <li key={index}>
                                    <b>{key}</b>: {value}
                                </li>
                            );
                        }
                    })}
                </ul>
            ) : null}
        </li>
    );
};
