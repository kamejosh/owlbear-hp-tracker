export type HPMode = "NUM" | "BAR";

export type HpTrackerMetadata = {
    name: string;
    hp: number;
    maxHp: number;
    armorClass: number;
    hpTrackerActive: boolean;
    canPlayersSee: boolean;
    hpOnMap: boolean;
    acOnMap: boolean;
    hpMode: HPMode;
};

export type HpTextMetadata = {
    isHpText: boolean;
};

export type SceneMetadata = {
    version: string;
    activeTokens: [];
};

export type TextItemChanges = {
    text?: string;
    visible?: boolean;
    position?: { x: number; y: number };
};

export type ShapeItemChanges = {
    width?: number;
    visible?: boolean;
    position?: { x: number; y: number };
};

export type Changes = {
    textItems: Map<string, TextItemChanges>;
    shapeItems: Map<string, ShapeItemChanges>;
};
