import { ItemOut } from "../../../helper/equipmentHelpers.ts";
import { Box, Chip, Divider, Paper, Stack, Typography } from "@mui/material";
import { DiceButtonWrapper } from "../../general/DiceRoller/DiceButtonWrapper.tsx";

const renderCost = (cost: ItemOut["cost"]) => {
    if (!cost) return null;
    const parts = [];
    if (cost.pp) parts.push(`${cost.pp}pp`);
    if (cost.gp) parts.push(`${cost.gp}gp`);
    if (cost.ep) parts.push(`${cost.ep}ep`);
    if (cost.sp) parts.push(`${cost.sp}sp`);
    if (cost.cp) parts.push(`${cost.cp}cp`);
    return parts.length > 0 ? parts.join(", ") : null;
};

const getRarityColor = (rarity: ItemOut["rarity"]) => {
    switch (rarity) {
        case "Common":
            return "default";
        case "Uncommon":
            return "success";
        case "Rare":
            return "primary";
        case "Very Rare":
            return "secondary";
        case "Legendary":
        case "Artifact":
        case "Unique":
            return "error";
        default:
            return "default";
    }
};

export const ItemHover = ({ item }: { item: ItemOut }) => {
    const costStr = renderCost(item.cost);
    const hasProperties = !!(item.weight || costStr || item.range);

    return (
        <Paper
            elevation={3}
            sx={{
                p: 2,
                maxWidth: 350,
                minWidth: 250,
                backgroundColor: "#2b2a33",
                color: "white",
                borderRadius: 2,
                border: "1px solid #444",
                overflowWrap: "break-word",
                overflowY: "scroll",
                maxHeight: "80vh",
                scrollbarColor: "rgba(255, 255, 255, 0.5) rgba(55, 55, 55, 0.1)",
                scrollbarWidth: "thin",
            }}
        >
            <Stack spacing={1}>
                <Box>
                    <Typography variant="h6" component="div" sx={{ fontWeight: "bold", lineHeight: 1.2 }}>
                        {item.name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                        <Typography variant="caption" sx={{ fontStyle: "italic", color: "#ccc" }}>
                            {item.type || "Item"}
                        </Typography>
                        {item.rarity && (
                            <Chip
                                label={item.rarity}
                                size="small"
                                color={getRarityColor(item.rarity)}
                                sx={{ height: 20, fontSize: "0.65rem", fontWeight: "bold" }}
                            />
                        )}
                    </Stack>
                </Box>

                <Divider sx={{ backgroundColor: "#444" }} />

                {hasProperties && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                        {item.weight !== undefined && item.weight !== null && (
                            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                                <b>Weight:</b> {item.weight} lb.
                            </Typography>
                        )}
                        {costStr && (
                            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                                <b>Cost:</b> {costStr}
                            </Typography>
                        )}
                        {item.range && (
                            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                                <b>Range:</b> {item.range}
                            </Typography>
                        )}
                    </Box>
                )}

                {item.ac && (
                    <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                        <b>Armor Class:</b> {item.ac.value} {item.ac.max_dex ? `(Max Dex ${item.ac.max_dex})` : ""}
                    </Typography>
                )}

                {item.description && (
                    <Box sx={{ fontSize: "0.85rem", "& p": { m: 0 } }}>
                        <DiceButtonWrapper
                            text={item.description}
                            context={item.name}
                            stats={{
                                strength: 10,
                                dexterity: 10,
                                constitution: 10,
                                intelligence: 10,
                                wisdom: 10,
                                charisma: 10,
                            }}
                        />
                    </Box>
                )}

                {item.charges && (
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: "bold", fontSize: "0.8rem" }}>
                            Charges:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                            {item.charges.uses} {item.charges.name}{" "}
                            {item.charges.resets && item.charges.resets.length > 0
                                ? `(Resets: ${item.charges.resets?.join(", ")})`
                                : null}
                        </Typography>
                    </Box>
                )}

                {item.spells && item.spells.length > 0 && (
                    <Box>
                        <Typography variant="body2" sx={{ fontWeight: "bold", fontSize: "0.8rem" }}>
                            Spells:
                        </Typography>
                        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {item.spells.map((s, i) => (
                                <Chip
                                    key={i}
                                    label={`${s.spell.name} (${s.charges})`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ color: "white", borderColor: "#555", height: 22, fontSize: "0.7rem" }}
                                />
                            ))}
                        </Stack>
                    </Box>
                )}

                {item.stats && (
                    <Box>
                        {item.stats.armor_class && (
                            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                                <b>Base AC:</b> {item.stats.armor_class.value}{" "}
                                {item.stats.armor_class.special && `(${item.stats.armor_class.special})`}
                            </Typography>
                        )}
                        {item.stats.hp && (
                            <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                                <b>HP:</b> {item.stats.hp.value}{" "}
                                {item.stats.hp.hit_dice && `(${item.stats.hp.hit_dice})`}
                            </Typography>
                        )}
                    </Box>
                )}

                {item.requires_attuning && (
                    <Typography variant="caption" sx={{ fontStyle: "italic", color: "#aaa", textAlign: "right" }}>
                        Requires Attunement
                    </Typography>
                )}
            </Stack>
        </Paper>
    );
};
