import { AbilityShareEntry } from "../../context/AbilityShareStore.tsx";
import { SendSvg } from "../svgs/SendSvg.tsx";
import { IconButton } from "./IconButton.tsx";
import { shareAbility } from "../../helper/helpers.ts";
import OBR from "@owlbear-rodeo/sdk";

export const ShareAbilityButton = ({ entry }: { entry: AbilityShareEntry }) => {
    return (
        <IconButton
            onClick={async () => {
                const playerIds = (await OBR.party.getPlayers()).map((player) => player.id);
                playerIds.push(OBR.player.id);
                entry.timestamp = new Date().getTime();
                entry.id = crypto.randomUUID();
                entry.visibleFor = playerIds;
                void shareAbility(entry);
            }}
        >
            <SendSvg />
        </IconButton>
    );
};
