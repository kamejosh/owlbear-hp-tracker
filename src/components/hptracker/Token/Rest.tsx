import { RestSvg } from "../../svgs/RestSvg.tsx";
import "./rest.scss";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { Image } from "@owlbear-rodeo/sdk";
import { rest } from "../../../helper/multiTokenHelper.ts";
import { useShallow } from "zustand/react/shallow";

export const Rest = ({ id }: { id: string }) => {
    const token = useTokenListContext(useShallow((state) => state.tokens?.get(id)));
    const item = token?.item as Image;
    return (
        <div className={"token-rest"}>
            <RestSvg />
            <button
                className={"button short"}
                onClick={() => {
                    rest([item], "Short Rest");
                }}
            >
                short
            </button>
            <button
                className={"button long"}
                onClick={() => {
                    rest([item], "Long Rest");
                }}
            >
                long
            </button>
        </div>
    );
};
