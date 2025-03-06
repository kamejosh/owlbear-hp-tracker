import { components } from "../../../api/schema";
import { GMGMetadata, Limit } from "../../../helper/types.ts";
import { itemMetadataKey } from "../../../helper/variables.ts";
import { updateItems } from "../../../helper/obrHelper.ts";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./limits.module.scss";
import Tippy from "@tippyjs/react";
import { useLongPress } from "../../../helper/hooks.ts";

export type LimitType = components["schemas"]["src__types__base__LimitedUse"];

const BoxLimits = ({ limit, limitValues, itemId }: { limit: LimitType; limitValues: Limit; itemId: string }) => {
    return (
        <>
            {Array(limit.uses)
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

const BarLimits = ({ limit, limitValues, itemId }: { limit: LimitType; limitValues: Limit; itemId: string }) => {
    const unused = limit.uses - limitValues.used;

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
                <Tippy content={"Click to reduce uses by one"}>
                    <div className={styles.used} style={{ flexGrow: limitValues.used }} {...onLongPressRemove}>
                        {limitValues.used}
                    </div>
                </Tippy>
            ) : null}
            {unused > 0 ? (
                <Tippy content={"Click to mark on use"}>
                    <div className={styles.unused} style={{ flexGrow: unused }} {...onLongPressAdd}>
                        {unused}
                    </div>
                </Tippy>
            ) : null}
        </div>
    );
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
    const getTitle = () => {
        if (title === "name") {
            return <h4>{limit.name}</h4>;
        } else if (title === "uses") {
            return <b>uses</b>;
        } else {
            return null;
        }
    };
    return (
        <div className={"limit"}>
            <div className={"limit-heading"}>
                {getTitle()}
                <div className={"limit-uses"}>
                    {limit.uses > 10 ? (
                        <BarLimits limit={limit} limitValues={limitValues} itemId={itemId} />
                    ) : (
                        <BoxLimits limit={limit} limitValues={limitValues} itemId={itemId} />
                    )}
                </div>
            </div>
            {limit.description && !hideDescription ? (
                <Markdown remarkPlugins={[remarkGfm]}>{limit.description}</Markdown>
            ) : null}
            {limit.resets && !hideReset ? (
                <div>
                    <b>Resets after:</b> {limit.resets.join(", ")}
                </div>
            ) : null}
        </div>
    );
};
