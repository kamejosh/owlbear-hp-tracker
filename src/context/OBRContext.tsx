import React, { useContext, useState } from "react";
import OBR from "@owlbear-rodeo/sdk";

export type OBRContextType = {
    initialized: boolean;
};

export const OBRContext = React.createContext<OBRContextType>({ initialized: false });

export const useOBRContext = (): OBRContextType => {
    const obrContext = useContext(OBRContext);
    if (!obrContext.initialized) {
        throw new Error("OBR not yet intialized");
    }

    return obrContext;
};

export const OBRContextProvider = (props: React.PropsWithChildren<{}>): JSX.Element => {
    const [initialized, setInitialized] = useState<boolean>(false);

    OBR.onReady(() => {
        setInitialized(true);
    });

    return <OBRContext.Provider value={{ initialized: initialized }}>{props.children}</OBRContext.Provider>;
};
