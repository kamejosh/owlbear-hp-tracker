import { useLocalStorageState } from "ahooks";
import { ID } from "../../helper/variables.ts";
import { ChevronRight } from "@mui/icons-material";
import { usePartyStore } from "../../context/PartyStore.tsx";
import { PartyInventoryOut, useGetParty, useGetPartyInventory } from "../../api/tabletop-almanac/useParty.ts";
import { useEffect, useState } from "react";

export const PartyInventory = () => {
    const currentParty = usePartyStore((state) => state.currentParty);

    const [partyId, setPartyId] = useState<number | undefined>(currentParty?.id);
    const [inventoryId, setInventoryId] = useState<number | undefined>(undefined);

    const partyQuery = useGetParty(partyId);
    const partyInventoryQuery = useGetPartyInventory(partyId, inventoryId);

    useEffect(() => {
        if (partyQuery.isSuccess) {
            setInventoryId(partyQuery.data.inventory?.id);
        }
    }, [partyQuery.isSuccess]);

    const inventory: PartyInventoryOut = partyInventoryQuery.isSuccess ? partyInventoryQuery.data : null;

    const [collapsed, setCollapsed] = useLocalStorageState<boolean>(`${ID}.party.inventory.collapsed`, {
        defaultValue: false,
    });

    if (currentParty && inventory)
        return (
            <div>
                <div style={{ display: "flex", gap: "1ch", alignItems: "center", justifyContent: "space-between" }}>
                    <h3>Inventory</h3>
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ display: "flex", gap: "1ch", alignItems: "center" }}
                    >
                        <ChevronRight sx={{ rotate: collapsed ? "0deg" : "90deg", transition: "all 0.25s ease" }} />
                    </button>
                </div>
                {collapsed ? null : (
                    <ul style={{ listStyle: "none", padding: 0, display: "flex", gap: "1ch", flexDirection: "column" }}>
                        {inventory.items?.map((item) => {
                            return (
                                <li
                                    key={item.id}
                                    style={{
                                        textAlign: "left",
                                        borderRadius: "8px",
                                        padding: "5px 24px",
                                    }}
                                >
                                    {item.count}x {item.item.name}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        );
};
