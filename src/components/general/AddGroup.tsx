import { useMetadataContext } from "../../context/MetadataContext.ts";
import { useState } from "react";
import { updateSceneMetadata } from "../../helper/helpers.ts";

export const AddGroup = () => {
    const scene = useMetadataContext.getState().scene;
    const [addGroup, setAddGroup] = useState<boolean>(false);
    const [value, setValue] = useState<string>("");

    if (addGroup) {
        return (
            <div style={{ display: "flex", gap: "1ch", width: "100%" }}>
                <input
                    style={{ flexGrow: 1, minWidth: "100px" }}
                    type={"text"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            const groups = [...(scene?.groups ?? [])];
                            groups.push(value);
                            void updateSceneMetadata(scene, { groups: groups });
                            setAddGroup(false);
                        }
                    }}
                />
                <button
                    onClick={() => {
                        const groups = [...(scene?.groups ?? [])];
                        groups.push(value);
                        void updateSceneMetadata(scene, { groups: groups });
                        setAddGroup(false);
                    }}
                >
                    Save
                </button>
                <button onClick={() => setAddGroup(false)}>Cancel</button>
            </div>
        );
    }

    return (
        <button onClick={() => setAddGroup(true)} style={{ width: "100%" }}>
            Add Group
        </button>
    );
};
