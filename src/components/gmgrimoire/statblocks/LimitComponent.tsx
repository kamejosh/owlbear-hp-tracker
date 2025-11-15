import { components } from "../../../api/schema";
import { GMGMetadata, Limit } from "../../../helper/types.ts";
import { itemMetadataKey } from "../../../helper/variables.ts";
import { updateItems } from "../../../helper/obrHelper.ts";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./limits.module.scss";
import Tippy from "@tippyjs/react";
import { useLongPress } from "../../../helper/hooks.ts";
import remarkBreaks from "remark-breaks";
import { useCallback } from "react";
import { useE5StatblockContext } from "../../../context/E5StatblockContext.tsx";
import { DiceButton } from "../../general/DiceRoller/DiceButtonWrapper.tsx";

export type LimitType = components["schemas"]["src__model_types__base__LimitedUse"];

const BoxLimits = ({ limitValues, itemId }: { limitValues: Limit; itemId: string }) => {
    if (limitValues.max === 0 || isNaN(limitValues.max) || limitValues.max === undefined || limitValues.max === null) {
        return <></>;
    }
    return (
        <>
            {Array(limitValues.max)
                .fill(0)
                .map((_, i) => {
                    const used = i < limitValues.used;
                    return (
                        <div
                            key={i}
                            className={`limit-use ${used ? "used" : ""}`}
                            onClick={async () => {
                                await updateItems([itemId], (items) => {
                                    items.forEach((item) => {
                                        if (item) {
                                            const metadata = item.metadata[itemMetadataKey] as GMGMetadata;
                                            if (metadata) {
                                                const index = metadata.stats.limits?.findIndex((l) => {
                                                    return l.id === limitValues.id;
                                                });
                                                if (index !== undefined) {
                                                    // @ts-ignore
                                                    item.metadata[itemMetadataKey]["stats"]["limits"][index]["used"] =
                                                        used ? limitValues.used - 1 : limitValues.used + 1;
                                                }
                                            }
                                        }
                                    });
                                });
                            }}
                        ></div>
                    );
                })}
        </>
    );
};

const BarLimits = ({ limitValues, itemId }: { limitValues: Limit; itemId: string }) => {
    const unused = limitValues.max - limitValues.used;

    const update = async (mod: number) => {
        await updateItems([itemId], (items) => {
            items.forEach((item) => {
                if (item) {
                    const metadata = item.metadata[itemMetadataKey] as GMGMetadata;
                    if (metadata) {
                        const index = metadata.stats.limits?.findIndex((l) => {
                            return l.id === limitValues.id;
                        });
                        if (index !== undefined) {
                            // @ts-ignore
                            item.metadata[itemMetadataKey]["stats"]["limits"][index]["used"] = Math.max(
                                Math.min(limitValues.used + mod, limitValues.max),
                                0,
                            );
                        }
                    }
                }
            });
        });
    };

    const onLongPressAdd = useLongPress(
        async () => await update(5),
        async () => await update(1),
        500,
    );
    const onLongPressRemove = useLongPress(
        async () => await update(-5),
        async () => await update(-1),
        500,
    );

    return (
        <div className={`${styles.box} limit-box`}>
            {limitValues.used > 0 ? (
                <Tippy content={"Click to reduce uses by one (Long press for -5)"}>
                    <div className={styles.used} style={{ flexGrow: limitValues.used }} {...onLongPressRemove}>
                        {limitValues.used}
                    </div>
                </Tippy>
            ) : null}
            {unused > 0 ? (
                <Tippy content={"Click to mark on use (Long press for +5)"}>
                    <div className={styles.unused} style={{ flexGrow: unused }} {...onLongPressAdd}>
                        {unused}
                    </div>
                </Tippy>
            ) : null}
        </div>
    );
};

export const update = async (itemId: string, value: number, limitId: string) => {
    await updateItems([itemId], (items) => {
        items.forEach((item) => {
            if (item) {
                const metadata = item.metadata[itemMetadataKey] as GMGMetadata;
                if (metadata) {
                    const index = metadata.stats.limits?.findIndex((l) => {
                        return l.id === limitId;
                    });
                    if (index !== undefined) {
                        // @ts-ignore
                        item.metadata[itemMetadataKey]["stats"]["limits"][index]["used"] = Math.max(value, 0);
                    }
                }
            }
        });
    });
};

export const LimitComponent = ({
    limit,
    title,
    limitValues,
    itemId,
    hideReset,
    hideDescription,
}: {
    limit: LimitType;
    title: "name" | "uses" | "none";
    limitValues: Limit;
    itemId: string;
    hideReset?: boolean;
    hideDescription?: boolean;
}) => {
    const statblockContext = useE5StatblockContext();
    const getTitle = () => {
        if (title === "name") {
            return <h4>{limit.name}</h4>;
        } else if (title === "uses") {
            return <b>uses</b>;
        } else {
            return null;
        }
    };

    const getFormula = useCallback(() => {
        if (limit.formula) {
            const comparisonRegex = /(.*)\s*([><])\s*(.*)/;
            const comparisonMatch = limit.formula.match(comparisonRegex);

            if (comparisonMatch) {
                const [_, dice, operator, comparator] = comparisonMatch;
                return (
                    <DiceButton
                        dice={dice}
                        text={limit.formula}
                        context={limit.name}
                        stats={statblockContext.stats}
                        statblock={statblockContext.tokenName}
                        skills={statblockContext.statblock.skills}
                        onRoll={async (rollResult) => {
                            let result = 0;
                            try {
                                if (rollResult && "total" in rollResult) {
                                    result = rollResult.total;
                                } else if (rollResult && "values" in rollResult) {
                                    result = rollResult.values.map((v) => v.value).reduce((a, b) => a + b, 0);
                                } else if (rollResult && "result" in rollResult) {
                                    result = rollResult.result.totalValue;
                                }
                                if (limit.resets?.includes("Formula")) {
                                    if (operator === ">" && result > Number(comparator)) {
                                        await update(itemId, 0, limitValues.id);
                                    } else if (operator === "<" && result < Number(comparator)) {
                                        await update(itemId, 0, limitValues.id);
                                    }
                                }
                            } catch {}
                        }}
                    />
                );
            } else {
                return (
                    <DiceButton
                        dice={limit.formula}
                        text={limit.formula}
                        context={limit.name}
                        stats={statblockContext.stats}
                        statblock={statblockContext.tokenName}
                        skills={statblockContext.statblock.skills}
                        onRoll={async (rollResult) => {
                            let result = 0;
                            try {
                                if (rollResult && "total" in rollResult) {
                                    result = rollResult.total;
                                } else if (rollResult && "values" in rollResult) {
                                    result = rollResult.values.map((v) => v.value).reduce((a, b) => a + b, 0);
                                } else if (rollResult && "result" in rollResult) {
                                    result = rollResult.result.totalValue;
                                }
                                if (limit.resets?.includes("Formula")) {
                                    await update(itemId, limitValues.used - result, limitValues.id);
                                }
                            } catch {}
                        }}
                    />
                );
            }
        } else {
            return null;
        }
    }, [limit.formula, limit.resets, limitValues.used, limitValues.id, limit.name]);

    return (
        <div className={"limit"}>
            <div className={"limit-heading"}>
                {getTitle()}
                <div className={"limit-uses"}>
                    {limitValues.max > 10 ? (
                        <BarLimits limitValues={limitValues} itemId={itemId} />
                    ) : (
                        <BoxLimits limitValues={limitValues} itemId={itemId} />
                    )}
                </div>
            </div>
            {limit.description && !hideDescription ? (
                <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{limit.description}</Markdown>
            ) : null}
            {limit.resets && !hideReset ? (
                <div>
                    <b>Resets after:</b> {limit.resets.join(", ")}
                </div>
            ) : null}
            {limit.formula ? <div>Formula: {getFormula()}</div> : null}
        </div>
    );
};
