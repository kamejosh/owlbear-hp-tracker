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
    ruleset?: Ruleset;
    groups?: Array<string>;
    openChangeLog?: boolean;
};

export type TextItemChanges = {
    text?: string;
    visible?: boolean;
    position?: { x: number; y: number };
};

export type ShapeItemChanges = {
    color?: string;
    width?: number;
    visible?: boolean;
    position?: { x: number; y: number };
};

export type Ruleset = "e5" | "pf";
