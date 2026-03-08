import { Close } from "@mui/icons-material";
import styles from "./button.module.css";

export const CancelButton = ({ onClick }: { onClick: () => void }) => (
    <button onClick={onClick} className={styles.cancelButton} type={"button"}>
        <Close />
    </button>
);
