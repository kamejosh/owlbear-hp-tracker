import styles from "./statblock-actions.module.scss";
import { FancyLineBreak, LineBreak } from "../../../general/LineBreak.tsx";
import { Action, PfAbility, Reaction, SpecialAbility } from "./PfAbility.tsx";
import { usePFStatblockContext } from "../../../../context/PFStatblockContext.tsx";

export const PFAbilities = ({
    heading,
    abilities,
}: {
    heading: string;
    abilities?: Array<Action | Reaction | SpecialAbility> | null;
}) => {
    const { statblock, stats } = usePFStatblockContext();
    return (
        <div>
            <h3 className={styles.heading}>{heading}</h3>
            <FancyLineBreak />
            {abilities?.map((action, index) => {
                return (
                    <div key={index}>
                        <PfAbility key={index} ability={action} statblock={statblock.name} stats={stats} />
                        <LineBreak />
                    </div>
                );
            })}
        </div>
    );
};
