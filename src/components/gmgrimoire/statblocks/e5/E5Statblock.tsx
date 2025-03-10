import { useMetadataContext } from "../../../../context/MetadataContext.ts";
import { useE5GetStatblock } from "../../../../api/e5/useE5Api.ts";
import { useShallow } from "zustand/react/shallow";
import { E5StatblockContextProvider, useE5StatblockContext } from "../../../../context/E5StatblockContext.tsx";
import { Loader } from "../../../general/Loader.tsx";
import styles from "./e5statblock.module.scss";
import { E5StatblockValues } from "./E5StatblockValues.tsx";
import { E5StatblockContent } from "./E5StatblockContent.tsx";
import Tippy from "@tippyjs/react";

export const E5StatBlock = () => {
    const { statblock } = useE5StatblockContext();

    return (
        <div className={styles.statblock}>
            <div className={styles.title}>
                <div>
                    <Tippy content={`${statblock.size} ${statblock.type}, ${statblock.alignment}`}>
                        <h1 className={styles.name}>{statblock.name}</h1>
                    </Tippy>
                    <div className={styles.note}>
                        {statblock.size} {statblock.type}, {statblock.alignment}
                    </div>
                </div>
                <E5StatblockValues />
            </div>
            <E5StatblockContent />
        </div>
    );
};

export const E5StatBlockWrapper = ({ slug, itemId }: { slug: string; itemId: string }) => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const statblockQuery = useE5GetStatblock(slug, room?.tabletopAlmanacAPIKey);
    const statblock = statblockQuery.isSuccess && statblockQuery.data ? statblockQuery.data : null;

    return statblock ? (
        <E5StatblockContextProvider itemId={itemId} statblock={statblock}>
            <E5StatBlock />
        </E5StatblockContextProvider>
    ) : (
        <Loader />
    );
};
