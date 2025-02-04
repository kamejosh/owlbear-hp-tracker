import { useMetadataContext } from "../../../../context/MetadataContext.ts";
import { usePfGetStatblock } from "../../../../api/pf/usePfApi.ts";
import { useShallow } from "zustand/react/shallow";
import { PFStatblockContextProvider, usePFStatblockContext } from "../../../../context/PFStatblockContext.tsx";
import styles from "../e5/e5statblock.module.scss";
import { Loader } from "../../../general/Loader.tsx";
import { PFStatblockValues } from "./PFStatblockValues.tsx";
import { PFStatblockContent } from "./PFStatblockContent.tsx";

export const PFStatBlock = () => {
    const { statblock } = usePFStatblockContext();

    return (
        <div className={styles.statblock}>
            <div className={styles.title}>
                <div>
                    <h1 className={styles.name}>{statblock.name}</h1>
                    <div className={styles.note}>
                        Type: {statblock.type}, Level: {statblock.level}
                    </div>
                </div>
                <PFStatblockValues />
            </div>
            <PFStatblockContent />
        </div>
    );
};

export const PFStatBlockWrapper = ({ slug, itemId }: { slug: string; itemId: string }) => {
    const room = useMetadataContext(useShallow((state) => state.room));
    const statblockQuery = usePfGetStatblock(slug, room?.tabletopAlmanacAPIKey);
    const statblock = statblockQuery.isSuccess && statblockQuery.data ? statblockQuery.data : null;

    return statblock ? (
        <PFStatblockContextProvider itemId={itemId} statblock={statblock}>
            <PFStatBlock />
        </PFStatblockContextProvider>
    ) : (
        <Loader />
    );
};
