import { PropsWithChildren } from "react";
import { useLocalStorageState } from "ahooks";
import { ChevronRight } from "@mui/icons-material";

export const PartyCollapse = (props: PropsWithChildren & { storageKey: string; heading: string }) => {
    const [collapsed, setCollapsed] = useLocalStorageState<boolean>(props.storageKey, {
        defaultValue: false,
    });
    return (
        <div>
            <div
                style={{
                    display: "flex",
                    gap: "1ch",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <h3>{props.heading}</h3>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ display: "flex", gap: "1ch", alignItems: "center" }}
                >
                    <ChevronRight sx={{ rotate: collapsed ? "0deg" : "90deg", transition: "all 0.25s ease" }} />
                </button>
            </div>
            {collapsed ? null : props.children}
        </div>
    );
};
