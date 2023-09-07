---
title: HP Tracker
description: A Tool that keeps track of the Character Stats of each Token where enabled 
author: Joshua Hercher
image: https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/HP_Tracker.png
icon: https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/public/icon.svg
tags:
  - combat
  - tool
  - automation
manifest: https://hp-tracker.onrender.com/manifest.json
learn-more: https://github.com/kamejosh/owlbear-hp-tracker
---

# Contents

- [HP Tracker - Owlbear Plugin](#hp-tracker-owlbear-plugin)
- [How it works](#how-it-works)
  + [Adding Tokens to the HP Tracker](#adding-tokens-to-the-hp-tracker)
  + [Hp Tracker Action Window](#hp-tracker-action-window)
    - [Version Information and Help Buttons](#version-information-and-help-buttons)
    - [Global Settings](#global-settings)
    - [Token List](#token-list)
    - [Token](#token)
      * [Toggle Buttons](#toggle-buttons)
      * [Changing Values](#changing-values)
    - [Statblock](#statblock)
    - [Player Action Window](#player-action-window)
  + [Hp Tracker Popover](#hp-tracker-popover)

# HP Tracker - Owlbear Plugin

This extension allows tracking and changing multiple Creature Settings while dynamically hide and show this information to players.

![hp-tracker example](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/HP_Tracker.png)

# How it works

The extension has two windows:

+ [Hp Tracker action window](#hp-tracker-action-window)
+ [Hp Tracker popover](#hp-tracker-popover)

As well as the following on scene information:

+ HP Bar
+ HP Text
+ AC Text

### Adding Tokens to the HP Tracker

Tokens that have not yet been added to the HP Tracker have the following icon present when their context menu is open:

![Context Menu](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/context_menu.png)

Clicking this icon adds the token to the HP Tracker. You can select multiple tokens and activate them all by once.
When first clicked all the initial information is added to the tokens metadata, by default the name of the token is used as name to make loading [statblocks](#statblocks) easier.

Once the HP Tracker is active you can remove the token from the HP Tracker again by clicking the Remove HP Tracker Icon in the Context Menu:

Once a Token is deleted from a scene all the attached metadata is also removed so this cannot be undone.

In case you have a creature token multiple times in the same scene, it's easiest to setup one token and than copy it as often as you need because the HP Tracker information will be copied as well. This saves a lot of time when setting up scenes.

![Context Menu 2](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/context_menu2.png)

This does not remove the Tokens metadata so in case you want to reactivate the HP Tracker all previous information is still stored with the token.

### Hp Tracker Action Window

The Action Window can be opened by clicking the HP Tracker Action Icon in the Owlbear scene. It is meant as a place for the GM to setup his scene and creatures in it. It is also available for players in a simplified form see [Player Action Window](#player-action-window);

#### Version Information and Help Buttons

![Action Window Top](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_top.png)

At the top of the action window the current version of the extension is displayed as well as two buttons:
+ The [i] button opens the changelog so you can see recent changes
+ The [?] button opens the help menu which displays the same help information you are currently reading

#### Global Settings

![Action Window Global Settings](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_global_settings.png)

The global settings can be used to modify features affecting every token in the HP Tracker. The Hide/Show button toggles the visibility of the global settings.

The following settings are available:

+ HP Bar Segments: This setting can be used to obfuscate the real HP loss of a creature. E.g. when set to "2" the HP Bar does only differentiate between 3 states: Full HP, less than half HP and 0 HP. When changing the settings HP Bars are not updated until HP are change at least once.
+ Text and Bar Offset: To have a more flexible positioning of the HP Bar and Text, a value can be entered (negative or positiv number) and the position of the HP Bar and Text is then adjusted by this value
+ Allow negative HP/AC: By default negative HP and AC are not allowed but when this settings is checked HP and AC can be set to negative numbers. The HP Bar will always display negative HP as 0.
+ Groups: This setting allows to define different Groups used for ordering Tokens. There is an undeleteable "Default" group. The groups can be rearranged by dragging and dropping them in the desired order. To add a group use the text input below the group list. Press "Enter" to add a group to the list. Token in the HP Tracker maintain their group (if the group is deleted) but are associated with the default group until they are moved to a different group. So deleting and re-adding the same group keeps the previously associated tokens in the same group.

#### Token List

![Action Window Token List](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_token_list.png)

The Token List consists of The column headings, groups and tokens associated with each group. By default all groups are visible when opening a scene to ensure no hidden/forgotten tokens. Closing groups hides the tokens it contains in the list, but they are still tracked by the HP Tracker and the [Popover](#hp-tracker-popover) is still available.

Tokens can be moved between groups or reordered inside a group by dragging and dropping. This has no effect on the [Player Action Window](#player-action-window)

![token_list_dnd](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/token_list_dnd.gif)

Clicking a token results in the corresponding item in the scene to be selected. To Select multiple tokens hold "SHIFT", "CTRL", or "CMD" and click tokens. Clicking/Selecting results in the Owlbear Token Contextmenu to open. When selecting multiple tokens only the context menu for the first selected token is open, but all items are selected.

![token_list_select](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/token_list_select.gif)

Double-clicking a token focuses the scene on the corresponding icon:

![token_list_dblclk](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/token_list_dblclk.gif)

#### Token

![Action Window Token](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_token.png)

A token in the HP Tracker represents a single Owlbear scene item where the HP Tracker Extension has been activated. It consists of the following parts:

+ Dynamic Color Background (based on ratio between HP and max HP)
+ Name
  + Edit Name Button
+ [Toggle Buttons](#toggle-buttons)
  + Toggle HP Bar
  + Toggle HP Text
  + Toggle AC Text
  + Toggle Player Visibility
+ Values
  + Current HP
  + Max HP
  + AC
  + Initiative
+ Roll initiative
+ Open [Statblock](#statblock) Button

##### Toggle Buttons

**HP Bar Button**

This Button toggles the visibility of the HP Bar. If the HP Bar is set to visible it is visible for both GMs and Players. A token that has neither the HP Bar nor the Player Visibility Button active will not show up in the [Player Action Window](#player-action-window). A button with only the HP Bar Button active will show up only with name and dynamic-color background in the Player Action Window.

**HP Text Button**

This Button toggles if the Text Element displays the HP/maxHP values. If the Player Visibility Button is not active, the HP Text is invisible (only visible for GMs). You can check that, by noticing that the text is a little see through.

**AC Text Button**

This Button toggles if the Text Element displays the AC value. If the Player Visibility Button is not active, the AC Text is invisible (only visible for GMs). You can check that, by noticing that the text is a little see through.

**Player Visibility Button**

This Button toggles if texts, popover and values are visible for players. This button is usually reserved for PCs where the Players can enter their own (updated) values. E.g. if they lose HP.

##### Changing Values

Values can changed in a few different ways:

+ Arithmetic operations: for the HP field the value can be changed via arithmetic (+ and -) operations. If the current value is `"10"` and you edit the field like this `"10 + 3"` the field value will be changed to `"13"` once you set outside of the field or press enter.
+ Arrow Keys: when focus is on HP, maxHP or AC you can change the values by 1 by pressing up or down arrow keys
+ Entering a number: when focused on any field, you can delete its content and enter a new value.
+ Rolling Initiative: When clicking the Initiative Button a random number between 1 and 20 is rolled and the dexterity modifier from the [Statblock](#statblock) (if selected) added and entered as initiative value.

**Note: The HP value can never exceed the maxHP value. It can also not be a negative number if the [Global Setting](#global-settings) for "Allow negative numbers" is not selected. All symbols except numbers will be removed to maintain a compatible value.**

#### Statblock

The statblock offers a search field where you can search for creature statblocks on Open5e.com. Per default the Token Name is used to do an initial search.

All results for the current search are displayed with their HP, AC and CR visible.

![Statblock Search](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_search.png)

By clicking on one of the options this statblock is selected for the Token. If there are no values set for the Token, the values of the creature statblock are automatically used.

![Statblock Selected](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_selected.png)

The statblock shows the most important information of a creature as seen in the Picture.

#### Player Action Window

![Player Action Window](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/player_action_window.png)

The Player Action Window has reduced functionality compared to the GM Action Window. Tokens that have either the HP Bar activated or where Player Visibility is active show up in this window. Items that are invisible in the scene don't show up here!

For tokens that have the Player Visibility set, name change option, values and statblock are shown. Otherwise just the dynamic-color background ist there to indicate current status of the creature.

### Hp Tracker Popover

The HP Tracker Popover is a simplified version of the Action Window [Token](#token)

For the GM all options except for Name and statblock are available:

![Popover GM](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/popover_gm.png)

For the Players it is only available for items where the player visibility is activated. Also the Toggle buttons are not available.

![Popover GM](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/popover_player.png)