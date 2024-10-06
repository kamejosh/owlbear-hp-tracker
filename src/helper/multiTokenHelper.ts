import { itemMetadataKey } from "./variables.ts";
import { GMGMetadata, RoomMetadata } from "./types.ts";
import OBR, { Item } from "@owlbear-rodeo/sdk";
import { updateHp } from "./hpHelpers.ts";
import { updateAc } from "./acHelper.ts";

export const getHpOnMap = (list: Array<Item>) => {
    const hpMap = list.map((token) => {
        const metadata = token.metadata[itemMetadataKey] as GMGMetadata;
        return metadata.hpOnMap;
    });
    return hpMap.some((map) => map);
};

export const getHpForPlayers = (list: Array<Item>) => {
    const hpPlayers = list.map((token) => {
        const metadata = token.metadata[itemMetadataKey] as GMGMetadata;
        return metadata.playerMap?.hp || false;
    });
    return hpPlayers.some((map) => map);
};

export const getAcForPlayers = (list: Array<Item>) => {
    const acPlayers = list.map((token) => {
        const metadata = token.metadata[itemMetadataKey] as GMGMetadata;
        return metadata.playerMap?.ac ?? false;
    });
    return acPlayers.some((map) => map);
};

export const toggleHpOnMap = async (list: Array<Item>, room: RoomMetadata | null) => {
    const current = getHpOnMap(list);
    await OBR.scene.items.updateItems(list, (items) => {
        items.forEach((item) => {
            (item.metadata[itemMetadataKey] as GMGMetadata).hpOnMap = !current;
            (item.metadata[itemMetadataKey] as GMGMetadata).hpBar = !current && !room?.disableHpBar;
        });
    });
    for (const item of list) {
        const data = item.metadata[itemMetadataKey] as GMGMetadata;
        await updateHp(item, { ...data, hpOnMap: !current, hpBar: !current && !room?.disableHpBar });
    }
};

export const toggleHpForPlayers = async (list: Array<Item>) => {
    const current = getHpForPlayers(list);
    await OBR.scene.items.updateItems(list, (items) => {
        items.forEach((item) => {
            const data = item.metadata[itemMetadataKey] as GMGMetadata;
            (item.metadata[itemMetadataKey] as GMGMetadata).playerMap = {
                ac: !!data.playerMap?.ac,
                hp: !current,
            };
        });
    });
    for (const item of list) {
        const data = item.metadata[itemMetadataKey] as GMGMetadata;
        await updateHp(item, { ...data, playerMap: { ac: !!data.playerMap?.ac, hp: !current } });
    }
};

export const toggleAcForPlayers = async (list: Array<Item>) => {
    const current = getAcForPlayers(list);
    await OBR.scene.items.updateItems(list, (items) => {
        items.forEach((item) => {
            const data = item.metadata[itemMetadataKey] as GMGMetadata;
            (item.metadata[itemMetadataKey] as GMGMetadata).playerMap = {
                ac: !current,
                hp: !!data.playerMap?.hp,
            };
        });
    });
    for (const item of list) {
        const data = item.metadata[itemMetadataKey] as GMGMetadata;
        await updateAc(item, { ...data, playerMap: { hp: !!data.playerMap?.hp, ac: !current } });
    }
};

export const getAcOnMap = (list: Array<Item>) => {
    const acMap = list.map((token) => {
        const metadata = token.metadata[itemMetadataKey] as GMGMetadata;
        return metadata.acOnMap;
    });
    return acMap.some((map) => map);
};

export const toggleAcOnMap = async (list: Array<Item>) => {
    const current = getAcOnMap(list);
    await OBR.scene.items.updateItems(list, (items) => {
        items.forEach((item) => {
            (item.metadata[itemMetadataKey] as GMGMetadata).acOnMap = !current;
        });
    });
    for (const item of list) {
        const data = item.metadata[itemMetadataKey] as GMGMetadata;
        await updateAc(item, { ...data, acOnMap: !current });
    }
};

export const getTokenInPlayerList = (list: Array<Item>) => {
    const inList = list.map((token) => {
        const metadata = token.metadata[itemMetadataKey] as GMGMetadata;
        return metadata.playerList;
    });
    return inList.some((l) => l);
};

export const toggleTokenInPlayerList = async (list: Array<Item>) => {
    const current = getTokenInPlayerList(list);
    await OBR.scene.items.updateItems(list, (items) => {
        items.forEach((item) => {
            (item.metadata[itemMetadataKey] as GMGMetadata).playerList = !current;
        });
    });
};

export const rest = async (list: Array<Item>, restType: string) => {
    const hpUpdated: Array<string> = [];

    await OBR.scene.items.updateItems(list, (items) => {
        items.forEach((item) => {
            const data = item.metadata[itemMetadataKey] as GMGMetadata;
            const newLimits = data.stats.limits?.map((limit) => {
                if (limit.resets.includes(restType)) {
                    return { ...limit, used: 0 };
                } else {
                    return limit;
                }
            });
            (item.metadata[itemMetadataKey] as GMGMetadata).stats.limits = newLimits;
            if (restType === "Long Rest" && data.hp !== data.maxHp + (data.stats?.tempHp ?? 0)) {
                (item.metadata[itemMetadataKey] as GMGMetadata).hp = data.maxHp + (data.stats?.tempHp ?? 0);
                hpUpdated.push(item.id);
            }
        });
    });

    const updated = list.filter((i) => hpUpdated.includes(i.id));

    for (const item of updated) {
        const data = item.metadata[itemMetadataKey] as GMGMetadata;
        await updateHp(item, { ...data, hp: data.maxHp + (data.stats?.tempHp ?? 0) });
    }
};
