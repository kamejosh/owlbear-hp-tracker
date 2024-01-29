import { useMetadataContext } from "../../../context/MetadataContext.ts";
import { getDiceParticipant } from "../../../helper/diceHelper.ts";
import { usePlayerContext } from "../../../context/PlayerContext.ts";
import { useDiceRoller } from "../../../context/DDDiceContext.tsx";
import { updateRoomMetadata } from "../../../helper/helpers.ts";
import OBR, { Metadata } from "@owlbear-rodeo/sdk";

export const Logout = () => {
    const { room } = useMetadataContext();
    const { roller } = useDiceRoller();
    const playerContext = usePlayerContext();

    return (
        <button
            className={"dddice-disconnect"}
            onClick={async () => {
                if (room && playerContext.id) {
                    const participant = await getDiceParticipant(roller, room.diceRoom?.slug);

                    if (participant && room.diceRoom?.slug) {
                        roller.api?.room.leave(room.diceRoom.slug, participant.id.toString());
                    }

                    const diceUser = room.diceUser;
                    const index = diceUser?.findIndex((user) => user.playerId === playerContext.id);
                    if (diceUser && index && index >= 0) {
                        diceUser.splice(index, 1, {
                            playerId: playerContext.id,
                            apiKey: undefined,
                            lastUse: new Date().getTime(),
                            diceTheme: "silvie-lr1gjgod",
                            diceButtons: [],
                        });

                        await updateRoomMetadata(room, { diceUser: diceUser });
                        const dddiceMetadata: Metadata = {};
                        dddiceMetadata[`com.dddice/${playerContext.id}`] = "";
                        await OBR.room.setMetadata({ ...dddiceMetadata });
                    }
                }
            }}
        >
            Logout
        </button>
    );
};
