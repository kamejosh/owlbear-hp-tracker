import { forwardRef, PropsWithChildren } from "react";
import styles from "./icon-button.module.scss";

type IconButtonProps = PropsWithChildren<{
    onClick: () => void;
}>;

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(({ children, onClick }, ref) => {
    return (
        <button ref={ref} className={styles.iconButton} onClick={onClick}>
            {children}
        </button>
    );
});

// export const IconButton = (props: PropsWithChildren & { onClick: () => void }) => {
//     return (
//         <button className={styles.iconButton} onClick={props.onClick}>
//             {props.children}
//         </button>
//     );
// };
