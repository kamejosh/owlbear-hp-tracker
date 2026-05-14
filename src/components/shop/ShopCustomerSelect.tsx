import { PartyStoreStatblock } from "../../context/PartyStore.tsx";
import { MoneyDisplay } from "../money/MoneyDisplay.tsx";
import { setNullToZero } from "../../helper/moneyHelpers.ts";
import shopStyles from "./shop.module.scss";
import { E5Statblock } from "../../api/e5/useE5Api.ts";
import { FormControl, InputLabel, MenuItem, Select, Avatar, Box, Typography, SelectChangeEvent } from "@mui/material";

interface ShopCustomerSelectProps {
    members: PartyStoreStatblock[];
    member: PartyStoreStatblock | null;
    onMemberChange: (member: PartyStoreStatblock) => void;
    statblock: E5Statblock | null;
    isSuccess: boolean;
}

export const ShopCustomerSelect = ({
    members,
    member,
    onMemberChange,
    statblock,
    isSuccess,
}: ShopCustomerSelectProps) => {
    if (members.length === 0) {
        return (
            <p className={shopStyles.noMemberWarning}>
                You currently have no party member assigned, ask your GM to assign you a party member to buy items
                from this shops and add them to your inventory directly.
            </p>
        );
    }

    const handleSelectChange = (event: SelectChangeEvent<number | "">) => {
        const selectedId = event.target.value;
        const selectedMember = members.find((m) => m.partyStatblockId === selectedId);
        if (selectedMember) {
            onMemberChange(selectedMember);
        }
    };

    return (
        <Box className={shopStyles.customerSection}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap="1rem">
                <Box display="flex" alignItems="center" gap="1rem">
                    {members.length > 1 ? (
                        <FormControl variant="outlined" size="small" className={shopStyles.memberSelect}>
                            <InputLabel id="member-select-label">Customer</InputLabel>
                            <Select
                                labelId="member-select-label"
                                value={member?.partyStatblockId ?? ""}
                                onChange={handleSelectChange}
                                label="Customer"
                                sx={{
                                    color: "white",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "rgba(255, 255, 255, 0.3)",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "rgba(255, 255, 255, 0.5)",
                                    },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                                        borderColor: "#448844",
                                    },
                                    "& .MuiSvgIcon-root": {
                                        color: "white",
                                    },
                                }}
                                slotProps={{
                                    paper: {
                                        sx: {
                                            backgroundColor: "#2b2a33",
                                            color: "white",
                                            "& .MuiMenuItem-root:hover": {
                                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                                            },
                                            "& .Mui-selected": {
                                                backgroundColor: "rgba(68, 136, 68, 0.4) !important",
                                            },
                                        },
                                    },
                                }}
                            >
                                {members.map((m) => (
                                    <MenuItem key={m.partyStatblockId} value={m.partyStatblockId}>
                                        <Box display="flex" alignItems="center" gap="1ch">
                                            {m.imageUrl && <Avatar src={m.imageUrl} sx={{ width: 24, height: 24 }} />}
                                            {m.statblock?.name}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    ) : (
                        <Box display="flex" alignItems="center" gap="1.5ch">
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                Customer:
                            </Typography>
                            <Box display="flex" alignItems="center" gap="1ch">
                                {member?.imageUrl && (
                                    <Avatar
                                        src={member.imageUrl}
                                        alt={member.statblock?.name ?? ""}
                                        sx={{ width: 32, height: 32, border: "1px solid rgba(255,255,255,0.1)" }}
                                    />
                                )}
                                <Typography variant="body1" fontWeight="bold">
                                    {member?.statblock?.name}
                                </Typography>
                            </Box>
                        </Box>
                    )}
                </Box>

                {isSuccess && statblock && (
                    <Box className={shopStyles.customerMoney}>
                        <MoneyDisplay
                            money={statblock.money ? setNullToZero(statblock.money) : undefined}
                            freeText="0cp"
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
};
