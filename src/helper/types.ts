export type HpTrackerMetadata = {
    name: string;
    hp: number;
    maxHp: number;
    armorClass: number;
    hpTrackerActive: boolean;
    canPlayersSee: boolean;
    hpOnMap: boolean;
    acOnMap: boolean;
    hpBar: boolean;
    initiative: number;
    sheet: string;
    stats: {
        initiativeBonus: number;
        tempHp?: number;
    };
    ruleset?: Ruleset;
    index?: number;
    group?: string;
};

export type SceneMetadata = {
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
