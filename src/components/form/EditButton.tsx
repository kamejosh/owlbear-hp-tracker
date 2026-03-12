import styles from "./button.module.css";
import { PropsWithChildren, ReactNode } from "react";
import { Edit } from "@mui/icons-material";

export type EditButtonProps = {
    alignCenter: boolean;
    onClick: () => void;
};

export type EditGroupProps = PropsWithChildren & {
    heading: ReactNode;
    alignLeft: boolean;
};
export const EditButton = ({ onClick, alignCenter }: EditButtonProps) => {
    return (
        <button onClick={onClick} className={`${styles.editButton} ${alignCenter ? "" : styles.editButtonTop}`}>
            <Edit />
        </button>
    );
};

export const EditGroup = (props: EditGroupProps & EditButtonProps) => {
    return (
        <div className={`${styles.editGroup} ${props.alignLeft ? styles.formLeft : styles.formRight}`}>
            <div className={styles.top}>
                {props.heading}
                <EditButton {...props} />
            </div>
            {props.children}
        </div>
    );
};
