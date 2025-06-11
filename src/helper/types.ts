export enum SORT {
    DESC,
    ASC,
}

export type Limit = {
    id: string;
    max: number;
    used: number;
    resets: Array<string>;
};

export type GMGMetadata = {
    hp: number;
    maxHp: number;
    armorClass: number;
    hpTrackerActive: boolean;
    canPlayersSee?: boolean;
    hpOnMap: boolean;
    acOnMap: boolean;
    hpBar: boolean;
    initiative: number;
    sheet: string;
    equipment?: {
        equipped: Array<string>;
        attuned: Array<string>;
    };
    stats: {
        initiativeBonus: number;
        tempHp?: number;
        initial?: boolean;
        limits?: Array<Limit>;
    };
    playerMap?: {
        hp: boolean;
        ac: boolean;
    };
    ruleset?: Ruleset;
    index?: number;
    group?: string;
    playerList?: boolean;
    isCurrent?: boolean;
    isNext?: boolean;
    endRound?: boolean;
};

/**
 * @deprecated The type is only used for migrations and should no longer be used in production code
 */
export type SceneMetadata_Deprecated = {
    version: string;
    id: string;
    allowNegativeNumbers?: boolean;
    hpBarSegments?: number;
    hpBarOffset?: number;
    acOffset?: { x: number; y: number };
    acShield?: boolean;
    ruleset?: Ruleset;
    groups?: Array<string>;
    openGroups?: Array<string>;
    openChangeLog?: boolean;
    initiativeDice?: number;
    statblockPopover?: { width: number; height: number };
    playerSort: boolean;
};

export type SceneMetadata = {
    version?: string;
    id?: string;
    groups?: Array<string>;
    openGroups?: Array<string>;
    collapsedStatblocks?: Array<string>;
    openStatblocks?: Array<string>;
    statblockPopoverOpen?: { [key: string]: boolean };
    sortMethod?: SORT;
    enableAutoSort?: boolean;
};

export type DiceUser = {
    diceRendering: boolean;
    playerId: string;
    apiKey: string | undefined;
    lastUse: number;
    diceTheme: string;
};

export type RoomMetadata = {
    ruleset?: Ruleset;
    allowNegativeNumbers?: boolean;
    hpBarSegments?: number;
    hpBarOffset?: number;
    acOffset?: { x: number; y: number };
    acShield?: boolean;
    playerSort?: boolean;
    statblockPopover?: { width: number; height: number };
    initiativeDice?: number;
    ignoreUpdateNotification?: boolean;
    diceRoom?: { slug: string | undefined };
    diceUser?: Array<DiceUser>;
    disableDiceRoller?: boolean;
    tabletopAlmanacAPIKey?: string;
    disableHpBar?: boolean;
    disableColorGradient?: boolean;
};

export type AttachmentMetadata = {
    attachmentType: "BAR" | "AC" | "HP";
    isHpText: boolean;
};

export type TextItemChanges = {
    text?: string;
    visible?: boolean;
    position?: { x: number; y: number };
};

export type BarItemChanges = {
    color?: string;
    width?: number;
    visible?: boolean;
    position?: { x: number; y: number };
};

export type ACItemChanges = {
    visible?: boolean;
    text?: string;
    position?: { x: number; y: number };
};

export type Ruleset = "e5" | "pf";

export type InitialStatblockData = {
    hp: number;
    ac: number;
    bonus: number;
    slug: string;
    ruleset: Ruleset;
    limits: Array<Limit>;
    equipment?: {
        equipped: Array<string>;
        attuned: Array<string>;
    };
    darkvision: number | undefined | null;
};

export type BestMatch = {
    distance: number;
    source: string | undefined | null;
    statblock: InitialStatblockData;
};
