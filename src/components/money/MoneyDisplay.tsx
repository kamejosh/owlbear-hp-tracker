import { Money } from "../../helper/types";
import styles from "../party/party-inventory.module.scss";

export const MoneyDisplay = ({ money, freeText = "Free", className }: { money?: Money; freeText?: string; className?: string }) => {
    if (!money) return <span className={className}>{freeText}</span>;
    const parts = [];
    if (money.pp)
        parts.push(
            <span key="pp" className={`${styles.costItem} ${styles.pp}`}>
                {money.pp}pp
            </span>,
        );
    if (money.gp)
        parts.push(
            <span key="gp" className={`${styles.costItem} ${styles.gp}`}>
                {money.gp}gp
            </span>,
        );
    if (money.ep)
        parts.push(
            <span key="ep" className={`${styles.costItem} ${styles.ep}`}>
                {money.ep}ep
            </span>,
        );
    if (money.sp)
        parts.push(
            <span key="sp" className={`${styles.costItem} ${styles.sp}`}>
                {money.sp}sp
            </span>,
        );
    if (money.cp)
        parts.push(
            <span key="cp" className={`${styles.costItem} ${styles.cp}`}>
                {money.cp}cp
            </span>,
        );

    if (parts.length === 0) {
        return <span className={className}>{freeText}</span>;
    }

    return (
        <span className={`${styles.itemCost} ${className}`} style={{ display: "inline-flex", gap: "0.5ch" }}>
            {parts}
        </span>
    );
};
