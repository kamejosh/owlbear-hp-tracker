/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */


export interface paths {
  "/api/v1/creature/pf2e": {
    /** List Pf Creatures */
    get: operations["list_pf_creatures_api_v1_creature_pf2e_get"];
  };
  "/api/v1/creature/5e": {
    /** List Dnd Creatures */
    get: operations["list_dnd_creatures_api_v1_creature_5e_get"];
  };
  "/api/v1/creature/": {
    /** Post Creature */
    post: operations["post_creature_api_v1_creature__post"];
  };
  "/api/v1/creature/admin": {
    /** Post Creature Admin */
    put: operations["post_creature_admin_api_v1_creature_admin_put"];
  };
  "/api/v1/creature/pf2e/{slug}": {
    /** Get Pf Creature By Slug */
    get: operations["get_pf_creature_by_slug_api_v1_creature_pf2e__slug__get"];
  };
  "/api/v1/creature/5e/{slug}": {
    /** Get 5E Creature By Slug */
    get: operations["get_5e_creature_by_slug_api_v1_creature_5e__slug__get"];
  };
  "/api/v1/creature/pf/search/": {
    /** Search Pf Creatures */
    get: operations["search_pf_creatures_api_v1_creature_pf_search__get"];
  };
  "/api/v1/creature/5e/search/": {
    /** Search 5E Creatures */
    get: operations["search_5e_creatures_api_v1_creature_5e_search__get"];
  };
  "/api/v1/users/": {
    /** Create App */
    post: operations["create_app_api_v1_users__post"];
  };
  "/legal/": {
    /** Get Legal */
    get: operations["get_legal_legal__get"];
  };
}

export type webhooks = Record<string, never>;

export interface components {
  schemas: {
    /**
     * ActionTypeEnum
     * @enum {string}
     */
    ActionTypeEnum: "free-action" | "one-action" | "two-actions" | "three-actions";
    /** App */
    App: {
      /** Name */
      name: string;
      /** Api Key */
      api_key: string;
      /**
       * Scopes
       * @default []
       */
      scopes: string[];
      /** Stats Id */
      stats_id: string;
    };
    /** ArmorClass */
    "ArmorClass-Input": {
      /** Value */
      value: number;
      /** Special */
      special?: string | null;
    };
    /** ArmorClass */
    "ArmorClass-Output": {
      /** Value */
      value: number;
      /** Special */
      special: string | null;
    };
    /** Cursor[list[DnDCreatureOut]] */
    Cursor_list_DnDCreatureOut__: {
      /** Size */
      size: number;
      /** Last */
      last: string | null;
      /** Data */
      data: components["schemas"]["DnDCreatureOut"][];
    };
    /** Cursor[list[PFCreatureOut]] */
    Cursor_list_PFCreatureOut__: {
      /** Size */
      size: number;
      /** Last */
      last: string | null;
      /** Data */
      data: components["schemas"]["PFCreatureOut"][];
    };
    /** DnDCreatureIn */
    DnDCreatureIn: {
      /** Name */
      name: string;
      /** About */
      about: string;
      /** Size */
      size: string;
      /** Type */
      type: string;
      /** Subtype */
      subtype: string;
      /** Group */
      group?: string | null;
      /** Alignment */
      alignment: string;
      armor_class: components["schemas"]["ArmorClass-Input"];
      hp: components["schemas"]["app__models__dnd__Hitpoints"];
      speed: components["schemas"]["Speed-Input"];
      stats: components["schemas"]["Stats"];
      saving_throws: components["schemas"]["app__models__dnd__SavingThrows-Input"];
      /** Perception */
      perception?: number | null;
      skills: components["schemas"]["Skills-Input"];
      /** Damage Vulnerabilities */
      damage_vulnerabilities: string;
      /** Damage Resistances */
      damage_resistances: string;
      /** Damage Immunities */
      damage_immunities: string;
      /** Condition Immunities */
      condition_immunities: string;
      /**
       * Senses
       * @default []
       */
      senses?: string[] | null;
      /**
       * Languages
       * @default []
       */
      languages?: string[] | null;
      /** Challenge Rating */
      challenge_rating: string;
      /** Cr */
      cr: number;
      /**
       * Actions
       * @default []
       */
      actions?: components["schemas"]["app__models__dnd__Action-Input"][];
      /**
       * Reactions
       * @default []
       */
      reactions?: components["schemas"]["app__models__dnd__Action-Input"][];
      /** Legendary Desc */
      legendary_desc: string;
      /**
       * Legendary Actions
       * @default []
       */
      legendary_actions?: components["schemas"]["app__models__dnd__Action-Input"][];
      /**
       * Special Abilities
       * @default []
       */
      special_abilities?: components["schemas"]["app__models__dnd__Action-Input"][];
      /**
       * Spell List
       * @default []
       */
      spell_list?: string[];
      /** Source */
      source?: string | null;
    };
    /** DnDCreatureOut */
    DnDCreatureOut: {
      /** Name */
      name: string;
      /** About */
      about: string;
      /** Size */
      size: string;
      /** Type */
      type: string;
      /** Subtype */
      subtype: string;
      /** Group */
      group: string | null;
      /** Alignment */
      alignment: string;
      armor_class: components["schemas"]["ArmorClass-Output"];
      hp: components["schemas"]["app__models__dnd__Hitpoints"];
      speed: components["schemas"]["Speed-Output"];
      stats: components["schemas"]["Stats"];
      saving_throws: components["schemas"]["app__models__dnd__SavingThrows-Output"];
      /** Perception */
      perception: number | null;
      skills: components["schemas"]["Skills-Output"];
      /** Damage Vulnerabilities */
      damage_vulnerabilities: string;
      /** Damage Resistances */
      damage_resistances: string;
      /** Damage Immunities */
      damage_immunities: string;
      /** Condition Immunities */
      condition_immunities: string;
      /**
       * Senses
       * @default []
       */
      senses: string[] | null;
      /**
       * Languages
       * @default []
       */
      languages: string[] | null;
      /** Challenge Rating */
      challenge_rating: string;
      /** Cr */
      cr: number;
      /**
       * Actions
       * @default []
       */
      actions: components["schemas"]["app__models__dnd__Action-Output"][];
      /**
       * Reactions
       * @default []
       */
      reactions: components["schemas"]["app__models__dnd__Action-Output"][];
      /** Legendary Desc */
      legendary_desc: string;
      /**
       * Legendary Actions
       * @default []
       */
      legendary_actions: components["schemas"]["app__models__dnd__Action-Output"][];
      /**
       * Special Abilities
       * @default []
       */
      special_abilities: components["schemas"]["app__models__dnd__Action-Output"][];
      /**
       * Spell List
       * @default []
       */
      spell_list: string[];
      /** Source */
      source: string | null;
      /** User */
      user: string | null;
      /** Slug */
      slug: string;
      /** License */
      license: string;
    };
    /** HTTPValidationError */
    HTTPValidationError: {
      /** Detail */
      detail?: components["schemas"]["ValidationError"][];
    };
    /** PFCreatureIn */
    PFCreatureIn: {
      /** Name */
      name: string;
      /** Type */
      type: string;
      /** Level */
      level: number;
      /** Traits */
      traits: components["schemas"]["Trait"][];
      /** Senses */
      senses?: string[] | null;
      /** Perception */
      perception?: string | null;
      /** Languages */
      languages?: string[] | null;
      /** Skills */
      skills?: components["schemas"]["Skill"][] | null;
      stats: components["schemas"]["Stats"];
      /**
       * Items
       * @default []
       */
      items?: string[];
      armor_class: components["schemas"]["ArmorClass-Input"];
      saving_throws: components["schemas"]["app__models__pathfinder__SavingThrows-Input"];
      hp: components["schemas"]["app__models__pathfinder__Hitpoints-Input"];
      /**
       * Immunities
       * @default []
       */
      immunities?: string[];
      /**
       * Weaknesses
       * @default []
       */
      weaknesses?: string[];
      /**
       * Resistances
       * @default []
       */
      resistances?: string[];
      /** Speed */
      speed: string;
      /**
       * Actions
       * @default []
       */
      actions?: components["schemas"]["app__models__pathfinder__Action-Input"][];
      /**
       * Reactions
       * @default []
       */
      reactions?: components["schemas"]["Reaction-Input"][];
      /**
       * Spells
       * @default []
       */
      spells?: components["schemas"]["SpellCategory-Input"][];
      /** About */
      about?: string | null;
      /**
       * Special Abilities
       * @default []
       */
      special_abilities?: components["schemas"]["SpecialAbility"][];
    };
    /** PFCreatureOut */
    PFCreatureOut: {
      /** Name */
      name: string;
      /** Type */
      type: string;
      /** Level */
      level: number;
      /** Traits */
      traits: components["schemas"]["Trait"][];
      /** Senses */
      senses: string[] | null;
      /** Perception */
      perception: string | null;
      /** Languages */
      languages: string[] | null;
      /** Skills */
      skills: components["schemas"]["Skill"][] | null;
      stats: components["schemas"]["Stats"];
      /**
       * Items
       * @default []
       */
      items: string[];
      armor_class: components["schemas"]["ArmorClass-Output"];
      saving_throws: components["schemas"]["app__models__pathfinder__SavingThrows-Output"];
      hp: components["schemas"]["app__models__pathfinder__Hitpoints-Output"];
      /**
       * Immunities
       * @default []
       */
      immunities: string[];
      /**
       * Weaknesses
       * @default []
       */
      weaknesses: string[];
      /**
       * Resistances
       * @default []
       */
      resistances: string[];
      /** Speed */
      speed: string;
      /**
       * Actions
       * @default []
       */
      actions: components["schemas"]["app__models__pathfinder__Action-Output"][];
      /**
       * Reactions
       * @default []
       */
      reactions: components["schemas"]["Reaction-Output"][];
      /**
       * Spells
       * @default []
       */
      spells: components["schemas"]["SpellCategory-Output"][];
      /** About */
      about: string | null;
      /**
       * Special Abilities
       * @default []
       */
      special_abilities: components["schemas"]["SpecialAbility"][];
      /** User */
      user: string | null;
      /** Slug */
      slug: string;
      /** License */
      license: string;
    };
    /** Reaction */
    "Reaction-Input": {
      /** Name */
      name: string;
      /** Trigger */
      trigger?: string | null;
      /** Frequency */
      frequency?: string | null;
      /** Requirements */
      requirements?: string | null;
      /** Effect */
      effect?: string | null;
      /** Damage */
      damage?: string | null;
      /** Success */
      success?: string | null;
      /** Critical Success */
      critical_success?: string | null;
      /** Failure */
      failure?: string | null;
      /** Critical Failure */
      critical_failure?: string | null;
    };
    /** Reaction */
    "Reaction-Output": {
      /** Name */
      name: string;
      /** Trigger */
      trigger: string | null;
      /** Frequency */
      frequency: string | null;
      /** Requirements */
      requirements: string | null;
      /** Effect */
      effect: string | null;
      /** Damage */
      damage: string | null;
      /** Success */
      success: string | null;
      /** Critical Success */
      critical_success: string | null;
      /** Failure */
      failure: string | null;
      /** Critical Failure */
      critical_failure: string | null;
    };
    /**
     * RulesetEnum
     * @enum {string}
     */
    RulesetEnum: "5e" | "pf2e";
    /** Skill */
    Skill: {
      /** Name */
      name: string;
      /** Value */
      value: string;
    };
    /** Skills */
    "Skills-Input": {
      /** Acrobatics */
      acrobatics?: number | null;
      /** Animal Handling */
      animal_handling?: number | null;
      /** Arcana */
      arcana?: number | null;
      /** Athletics */
      athletics?: number | null;
      /** Deception */
      deception?: number | null;
      /** History */
      history?: number | null;
      /** Insight */
      insight?: number | null;
      /** Intimidation */
      intimidation?: number | null;
      /** Investigation */
      investigation?: number | null;
      /** Medicine */
      medicine?: number | null;
      /** Nature */
      nature?: number | null;
      /** Perception */
      perception?: number | null;
      /** Performance */
      performance?: number | null;
      /** Persuasion */
      persuasion?: number | null;
      /** Religion */
      religion?: number | null;
      /** Sleight Of Hand */
      sleight_of_hand?: number | null;
      /** Stealth */
      stealth?: number | null;
      /** Survival */
      survival?: number | null;
    };
    /** Skills */
    "Skills-Output": {
      /** Acrobatics */
      acrobatics: number | null;
      /** Animal Handling */
      animal_handling: number | null;
      /** Arcana */
      arcana: number | null;
      /** Athletics */
      athletics: number | null;
      /** Deception */
      deception: number | null;
      /** History */
      history: number | null;
      /** Insight */
      insight: number | null;
      /** Intimidation */
      intimidation: number | null;
      /** Investigation */
      investigation: number | null;
      /** Medicine */
      medicine: number | null;
      /** Nature */
      nature: number | null;
      /** Perception */
      perception: number | null;
      /** Performance */
      performance: number | null;
      /** Persuasion */
      persuasion: number | null;
      /** Religion */
      religion: number | null;
      /** Sleight Of Hand */
      sleight_of_hand: number | null;
      /** Stealth */
      stealth: number | null;
      /** Survival */
      survival: number | null;
    };
    /** SpecialAbility */
    SpecialAbility: {
      /** Name */
      name: string;
      /** Description */
      description: string;
    };
    /** Speed */
    "Speed-Input": {
      /** Walk */
      walk?: number | null;
      /** Fly */
      fly?: number | null;
      /** Swim */
      swim?: number | null;
      /** Climb */
      climb?: number | null;
      /** Burrow */
      burrow?: number | null;
      /** Hover */
      hover?: number | null;
      /** Lightwalking */
      lightwalking?: number | null;
      /** Notes */
      notes?: string | null;
    };
    /** Speed */
    "Speed-Output": {
      /** Walk */
      walk: number | null;
      /** Fly */
      fly: number | null;
      /** Swim */
      swim: number | null;
      /** Climb */
      climb: number | null;
      /** Burrow */
      burrow: number | null;
      /** Hover */
      hover: number | null;
      /** Lightwalking */
      lightwalking: number | null;
      /** Notes */
      notes: string | null;
    };
    /** SpellCategory */
    "SpellCategory-Input": {
      /** Name */
      name: string;
      /** Dc */
      dc: number;
      /** Attack */
      attack?: number | null;
      /**
       * Spell Lists
       * @default []
       */
      spell_lists?: components["schemas"]["Spelllist"][];
    };
    /** SpellCategory */
    "SpellCategory-Output": {
      /** Name */
      name: string;
      /** Dc */
      dc: number;
      /** Attack */
      attack: number | null;
      /**
       * Spell Lists
       * @default []
       */
      spell_lists: components["schemas"]["Spelllist"][];
    };
    /**
     * SpellTypeEnum
     * @enum {string}
     */
    SpellTypeEnum: "spell" | "cantrip" | "constant";
    /** Spelllist */
    Spelllist: {
      type: components["schemas"]["SpellTypeEnum"];
      /** Level */
      level: string;
      /** Spells */
      spells: string[];
    };
    /** Stats */
    Stats: {
      /** Strength */
      strength: number;
      /** Dexterity */
      dexterity: number;
      /** Constitution */
      constitution: number;
      /** Intelligence */
      intelligence: number;
      /** Wisdom */
      wisdom: number;
      /** Charisma */
      charisma: number;
    };
    /** Trait */
    Trait: {
      /** Name */
      name: string;
      /** Value */
      value: string;
    };
    /** ValidationError */
    ValidationError: {
      /** Location */
      loc: (string | number)[];
      /** Message */
      msg: string;
      /** Error Type */
      type: string;
    };
    /** Action */
    "app__models__dnd__Action-Input": {
      /** Name */
      name: string;
      /** Desc */
      desc: string;
      /** Attack Bonus */
      attack_bonus?: number | null;
      /** Damage Dice */
      damage_dice?: string | null;
    };
    /** Action */
    "app__models__dnd__Action-Output": {
      /** Name */
      name: string;
      /** Desc */
      desc: string;
      /** Attack Bonus */
      attack_bonus: number | null;
      /** Damage Dice */
      damage_dice: string | null;
    };
    /** Hitpoints */
    app__models__dnd__Hitpoints: {
      /** Value */
      value: number;
      /** Hit Dice */
      hit_dice: string;
    };
    /** SavingThrows */
    "app__models__dnd__SavingThrows-Input": {
      /** Strength Save */
      strength_save?: number | null;
      /** Dexterity Save */
      dexterity_save?: number | null;
      /** Constitution Save */
      constitution_save?: number | null;
      /** Intelligence Save */
      intelligence_save?: number | null;
      /** Wisdom Save */
      wisdom_save?: number | null;
      /** Charisma Save */
      charisma_save?: number | null;
    };
    /** SavingThrows */
    "app__models__dnd__SavingThrows-Output": {
      /** Strength Save */
      strength_save: number | null;
      /** Dexterity Save */
      dexterity_save: number | null;
      /** Constitution Save */
      constitution_save: number | null;
      /** Intelligence Save */
      intelligence_save: number | null;
      /** Wisdom Save */
      wisdom_save: number | null;
      /** Charisma Save */
      charisma_save: number | null;
    };
    /** Action */
    "app__models__pathfinder__Action-Input": {
      /** Name */
      name: string;
      type: components["schemas"]["ActionTypeEnum"];
      /** Description */
      description?: string | null;
      /** Damage */
      damage?: string | null;
      /** Trigger */
      trigger?: string | null;
      /** Requirements */
      requirements?: string | null;
      /** Effect */
      effect?: string | null;
      /** Frequency */
      frequency?: string | null;
      /** Success */
      success?: string | null;
      /** Critical Success */
      critical_success?: string | null;
      /** Failure */
      failure?: string | null;
      /** Critical Failure */
      critical_failure?: string | null;
      /** Constant */
      constant?: string | null;
    };
    /** Action */
    "app__models__pathfinder__Action-Output": {
      /** Name */
      name: string;
      type: components["schemas"]["ActionTypeEnum"];
      /** Description */
      description: string | null;
      /** Damage */
      damage: string | null;
      /** Trigger */
      trigger: string | null;
      /** Requirements */
      requirements: string | null;
      /** Effect */
      effect: string | null;
      /** Frequency */
      frequency: string | null;
      /** Success */
      success: string | null;
      /** Critical Success */
      critical_success: string | null;
      /** Failure */
      failure: string | null;
      /** Critical Failure */
      critical_failure: string | null;
      /** Constant */
      constant: string | null;
    };
    /** Hitpoints */
    "app__models__pathfinder__Hitpoints-Input": {
      /** Value */
      value: number;
      /** Special */
      special?: string | null;
    };
    /** Hitpoints */
    "app__models__pathfinder__Hitpoints-Output": {
      /** Value */
      value: number;
      /** Special */
      special: string | null;
    };
    /** SavingThrows */
    "app__models__pathfinder__SavingThrows-Input": {
      /** Fortitude */
      fortitude: number;
      /** Reflex */
      reflex: number;
      /** Will */
      will: number;
      /** Special */
      special?: string | null;
    };
    /** SavingThrows */
    "app__models__pathfinder__SavingThrows-Output": {
      /** Fortitude */
      fortitude: number;
      /** Reflex */
      reflex: number;
      /** Will */
      will: number;
      /** Special */
      special: string | null;
    };
  };
  responses: never;
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}

export type $defs = Record<string, never>;

export type external = Record<string, never>;

export interface operations {

  /** List Pf Creatures */
  list_pf_creatures_api_v1_creature_pf2e_get: {
    parameters: {
      query?: {
        limit?: number;
        last?: string;
        user_id?: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["Cursor_list_PFCreatureOut__"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** List Dnd Creatures */
  list_dnd_creatures_api_v1_creature_5e_get: {
    parameters: {
      query?: {
        limit?: number;
        last?: string;
        user_id?: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["Cursor_list_DnDCreatureOut__"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Post Creature */
  post_creature_api_v1_creature__post: {
    parameters: {
      query: {
        ruleset: components["schemas"]["RulesetEnum"];
        user_id: string;
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["PFCreatureIn"] | components["schemas"]["DnDCreatureIn"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["PFCreatureOut"] | components["schemas"]["DnDCreatureOut"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Post Creature Admin */
  post_creature_admin_api_v1_creature_admin_put: {
    parameters: {
      query: {
        ruleset: components["schemas"]["RulesetEnum"];
      };
    };
    requestBody: {
      content: {
        "application/json": components["schemas"]["PFCreatureIn"] | components["schemas"]["DnDCreatureIn"];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["PFCreatureOut"] | components["schemas"]["DnDCreatureOut"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get Pf Creature By Slug */
  get_pf_creature_by_slug_api_v1_creature_pf2e__slug__get: {
    parameters: {
      path: {
        slug: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["PFCreatureOut"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get 5E Creature By Slug */
  get_5e_creature_by_slug_api_v1_creature_5e__slug__get: {
    parameters: {
      path: {
        slug: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["DnDCreatureOut"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Search Pf Creatures */
  search_pf_creatures_api_v1_creature_pf_search__get: {
    parameters: {
      query: {
        search_string: string;
        limit?: number;
        last?: string;
        user_id?: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["Cursor_list_PFCreatureOut__"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Search 5E Creatures */
  search_5e_creatures_api_v1_creature_5e_search__get: {
    parameters: {
      query: {
        search_string: string;
        limit?: number;
        last?: string;
        user_id?: string;
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["Cursor_list_DnDCreatureOut__"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Create App */
  create_app_api_v1_users__post: {
    parameters: {
      query: {
        name: string;
      };
    };
    requestBody: {
      content: {
        "application/json": string[];
      };
    };
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": components["schemas"]["App"];
        };
      };
      /** @description Validation Error */
      422: {
        content: {
          "application/json": components["schemas"]["HTTPValidationError"];
        };
      };
    };
  };
  /** Get Legal */
  get_legal_legal__get: {
    responses: {
      /** @description Successful Response */
      200: {
        content: {
          "application/json": unknown;
        };
      };
    };
  };
}