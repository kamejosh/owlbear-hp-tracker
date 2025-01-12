import styles from "./line-break.module.scss";

export const LineBreak = () => {
    return (
        <div className={styles.lineBreak}>
            <span className={styles.line}></span>
        </div>
    );
};
