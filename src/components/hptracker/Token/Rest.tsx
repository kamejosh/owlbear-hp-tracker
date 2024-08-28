import { RestSvg } from "../../svgs/RestSvg.tsx";
import "./rest.scss";
import { useTokenListContext } from "../../../context/TokenContext.tsx";
import { HpTrackerMetadata } from "../../../helper/types.ts";
import { updateTokenMetadata } from "../../../helper/tokenHelper.ts";

export const Rest = ({ id }: { id: string }) => {
    const token = useTokenListContext((state) => state.tokens?.get(id));
    const data = token?.data as HpTrackerMetadata;
    return (
        <div className={"token-rest"}>
            <RestSvg />
            <button
                className={"button short"}
                onClick={() => {
                    const newLimits = data.stats.limits?.map((limit) => {
                        if (limit.resets.includes("Short Rest")) {
                            return { ...limit, used: 0 };
                        } else {
                            return limit;
                        }
                    });
                    updateTokenMetadata({ ...data, stats: { ...data.stats, limits: newLimits } }, [id]);
                }}
            >
                short
            </button>
            <button
                className={"button long"}
                onClick={() => {
                    const newLimits = data.stats.limits?.map((limit) => {
                        if (limit.resets.includes("Long Rest")) {
                            return { ...limit, used: 0 };
                        } else {
                            return limit;
                        }
                    });
                    updateTokenMetadata({ ...data, stats: { ...data.stats, limits: newLimits } }, [id]);
                }}
            >
                long
            </button>
        </div>
    );
};
