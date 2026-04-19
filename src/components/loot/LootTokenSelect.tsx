import { useEffect, useState } from "react";
import OBR, { Item } from "@owlbear-rodeo/sdk";

export const LootTokenSelect = () => {
    const [tokens, setTokens] = useState<Array<Item>>([]);

    useEffect(() => {
        const init = async () => {
            const allTokens = await OBR.scene.items.getItems((i) => i.layer in ["CHARACTER", "PROP", "MOUNT"]);
            setTokens(allTokens);
        };
        init();
    }, []);

    if (tokens.length === 0) {
        return <div>No tokens found</div>;
    }

    return (
        <div>
            <h2>Select Token</h2>
            <select>
                {tokens.map((token) => (
                    <option key={token.id} value={token.id}>
                        {token.name}
                    </option>
                ))}
            </select>
        </div>
    );
};
