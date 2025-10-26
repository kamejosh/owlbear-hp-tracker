import { PropsWithChildren } from "react";
import styles from "./icon-button.module.scss";

export const IconButton = (props: PropsWithChildren & { onClick: () => void }) => {
    return (
        <button className={styles.iconButton} onClick={props.onClick}>
            {props.children}
        </button>
    );
};
