# Contents

- [HP Tracker - Owlbear Plugin](#hp-tracker-owlbear-plugin)
- [Quickstart](#quickstart)
- [How it works](#how-it-works)
  + [Adding Tokens to the HP Tracker](#adding-tokens-to-the-hp-tracker)
  + [Hp Tracker Action Window](#hp-tracker-action-window)
    - [Version Information and Help Buttons](#version-information-and-help-buttons)
    - [Global Settings](#global-settings)
    - [Token List](#token-list)
    - [Token](#token)
      * [Toggle Buttons](#toggle-buttons)
      * [Changing Values](#changing-values)
      * [Temporary Hitpoints](#temporary-hitpoints)
      * [Initializing Token](#initializing-token)
    - [Statblock](#statblock)
    - [Player Action Window](#player-action-window)
  + [Hp Tracker Context Menu](#hp-tracker-context-menu)
    - [Single Selection](#single-selection)
    - [Multi Selection](#multi-selection)
  + [Statblock Popover](#hp-tracker-statblock-popover)

# HP Tracker - Owlbear Plugin

Designed around the TTRPG game mechanics of Hit Points (HP) and Armor Class (AC), this extension allows tracking and changing multiple Creatures' settings while dynamically hiding and showing this information to players. 

![hp-tracker example](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/HP_Tracker.png)

# Quickstart

This section is intended to describe and show an example of how fast a combat sequence can be setup using HP Tracker.

## Scenario

Your players rest at a campsite but they fell asleep during their watch and were surprised by an Ogre and five Hobgoblins. We quickly roll initiative sort the Tokens so we know who's turn is next and start doing damage.
The PCs start the combat with three temporary HP because of effect that was activated before they setup camp.

## How

+ Create a new scene based on a map you have in your collection. 
+ Drop all the PC Tokens you need and fill in their info.
+ Drop an Ogre and Hobgoblin Token on scene and connect them with their statblocks
+ Copy the Hobgoblin Token four times
+ Roll initiative for the whole group and sort by initiative
+ Start combat

## Video Example

Because the documentation currently requires gif for moving content the quality and length is limited, for better video quality consider going to the owlbear discord.

![HP Tracker Quickstart](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/quickstart.gif)

# How it works

The extension has three windows:

+ [HP Tracker action window](#hp-tracker-action-window) 
+ [HP Tracker Context Menu](#hp-tracker-popover)
+ [HP Tracker statblock popover](#hp-tracker-statblock-popover)

As well as the following on-scene information:

+ HP Bar
+ HP Text
+ AC Text

### Adding Tokens to the HP Tracker

Tokens that have not yet been added to the HP Tracker have the following icon present when their context menu is open (right click on token):

![Context Menu](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/context_menu.png)

Clicking this icon adds the token to the HP Tracker and you can see its name appear in the extension's Action window. You can select multiple tokens and activate them all at once. 
When first clicked all the initial information is added to the tokens metadata, by default the name of the token is used, to make loading [statblocks](#statblocks) easier.

Once the HP Tracker is active you can remove the token from the HP Tracker again by clicking the Deactivate HP Tracker Icon in the Context Menu:

![Context Menu 2](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/context_menu2.png)

This does not remove the Tokens metadata so in case you want to reactivate the HP Tracker all previous information is still stored with the token.

Once a Token is deleted from a scene all the attached metadata is also removed so this cannot be undone.

In case you have a creature token multiple times within the same scene, it's easiest to setup one token and then copy it as often as you need, because the HP Tracker information will be copied as well. This saves a lot of time when setting up scenes.

### Hp Tracker Action Window

The Action Window can be opened by clicking the HP Tracker Action Icon in the Owlbear scene. It is meant as a place for the GM to setup his scene and creatures in it. It is also available for players in a simplified form see [Player Action Window](#player-action-window);

#### Version Information and Help Buttons

![Action Window Top](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_top.png)

At the top of the action window the current version of the extension is displayed as well as three system buttons, the statblock popover button and a link to the HP Tracker Patreon page. 

The system buttons open a new modal (changelog and help are opened in fullscreen mode):
+ The [⛭] buttons opens the [global settings](#global-settings).
+ The [i] button opens the changelog so you can see recent changes
+ The [?] button opens the help menu which displays the same help information you are currently reading

The statblock popover button opens a popover, for more information see [here](#hp-tracker-statblock-popover).

The Patreon Link opens in a new window.

#### Global Settings

![Action Window Global Settings](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_global_settings.png) 

The global settings can be used to modify features affecting every token in the HP Tracker. The close button closes the global settings.

The following settings are available:

+ Statblock Game Rules: You can choose between DnD 5e and Pathfinder 2e as source for your statblocks. This will impact what statblocks are found, how they are displayed, and the content (including spells).
+ HP Bar Segments: This setting can be used to obfuscate the real HP loss of a creature. E.g. when set to "2" the HP Bar differentiates between 3 states: Full HP, less than half HP, and 0 HP. When changing the settings HP Bars are not updated until the HP value is changed at least once.
+ Text and Bar Offset: To have a more flexible positioning of the HP Bar and Text, a value can be entered (negative or positive number) and the position of the HP Bar and Text is then adjusted by this value.
+ Armorclass Icon and Text Offset: To have a more flexible positioning of the AC Background and Text an offset for the X- and Y-Axis can be added. This value is scaled considering the Token size. 
+ Allow negative HP/AC: By default negative HP and AC are not allowed but when this settings is checked then HP and AC can be set to negative numbers. The HP Bar will always display negative HP the same as when it is 0.
+ Sort Tokens in Player View: When active, the [Player Action Window](#player-action-window) will display Tokens ordered by their initiative value. If not active, Tokens will have the same order as they were added to the scene (so kind of random).
+ Set Initiative Dice: This setting decides with which "dice" the roll initiative button in the groups and the token works. The default is 20, meaning a value from 1 to 20 (excl. modifiers) can be rolled. By setting it to 10 the value can only range from 1 to 10.
+ Statblock Popover dimensions: This settings allows to set the width and height of the statblock popover. The default is 600x500. When changing the value (either press enter or move cursor outside of input field) while the statblock popover is open the size of the open statblock popover is automatically adjusted so you can preview what size fits you. The width and height cannot be lower than 200 and settings bigger than the viewport will be overwritten by the max viewport size.
+ Groups: This setting allows you to define different Groups used for ordering Tokens. There is a permanent "Default" group. The groups can be rearranged by dragging and dropping them in the desired order. To add a group use the text input below the group list. Press "Enter" to add a group to the list. Tokens in the HP Tracker remember their group association (if the group is deleted) but are added into the default group until they are moved to a different group. So deleting and re-adding the same group restores the previously associated tokens to that same group.

#### Token List

![Action Window Token List](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_token_list.png)

The Token List consists of the column headings, groups and tokens associated with each group. HP Tracker remembers which groups are open or collapsed between sessions. Collapsing a group hides the tokens it contains in the list, but they are still tracked by the HP Tracker and the [Popover](#hp-tracker-popover) is still available.

When clicking the button next to INIT in the header all Tokens will be ordered by there initiative value. This is done per group so Tokens in different groups will not be changing positions.

Tokens can be moved between groups or reordered inside a group by dragging and dropping. By default this has no effect on the [Player Action Window](#player-action-window) but when the [setting](#global-settings) "Sort in Player View" is active, the Tokens in the Player Action Window follow the same order as in the GM Action Window.

When a selected Token is moved all selected Tokens in the same group are moved as well.

![token_list_dnd](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/token_list_dnd.gif)

Clicking a token results in the corresponding item in the scene to be selected. To Select multiple tokens hold "SHIFT", "CTRL", or "CMD" and click token names in the list. Just like in other programs, holding "SHIFT" and clicking a Token selects all Tokens between the clicked and the nearest selected Token. 

Selecting token names in this way causes the Owlbear Token Contextmenu to open. When selecting multiple tokens names only the context menu for the first selected token is opened, but all items are selected.

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
  + Toggle AC Shield and Text
  + Toggle Player Visibility
+ Values
  + Current HP
  + Max HP
  + Temporary HP
  + AC
  + Initiative
+ Roll initiative
+ Open/Assign [Statblock](#statblock) Button

##### Toggle Buttons

**HP Bar Button**

This Button toggles the visibility of the HP Bar for both the GM and the Players. If the HP Bar and the Player Visibility Button are disabled, the token will not show up in the [Player Action Window](#player-action-window). A token with only the HP Bar Button active will show up in the Player Action Window only with its name and dynamic-color background. Unlike the HP Text and AC Text, the HP Bar is unaffected by the status of the Player Visibility Button

**HP Text Button**

This Button determines whether the Text Element displays the HP/maxHP values. If the Player Visibility Button is not active, the HP Text is invisible to players (only visible for GMs). You can check that, by noticing that the text is a little see-through.

**AC Text Button**

This Button determines whether the AC Shield and AC Text are displayed. If the Player Visibility Button is not active, the AC is invisible to players (only visible for GMs). You can check that, by noticing that the shield and the text are a little see-through.

**Player Visibility Button**

This Button determines whether text, popover, and values are visible for players. This button is usually enabled for PC tokens where the Players can enter their own (updated) values. E.g. if they lose HP.

##### Changing Values

Values can be changed in a few different ways:

+ Arithmetic operations: for the HP field the value can be changed via arithmetic (+ and -) operations. If the current value is `"10"` and you edit the field like this `"10 + 3"` the field value will be changed to `"13"` once you select anything outside of the field or press enter.
+ Arrow Keys: when focus is on HP, maxHP, tempHP or AC you can increase or decrease the values by 1 by pressing up or down arrow key respectively
+ Entering a number: when focused on any field, you can delete its content and enter a new value. 
  + Note that changing the maxHP or tempHP field influences the HP field.
+ Rolling Initiative: When clicking the Initiative Button a random number between 1 and the chosen [Initiative Dice](#global-settings) (default: 20) is rolled and the dexterity modifier (5e) or perception (pf2e) from the [Statblock](#statblock) (if selected) is added and entered as the final initiative value. You can also change the initiative bonus to any number, once a statblock is assigned

**Note: The HP value can never exceed the maxHP value ([except when maxHP is 0](#initializing-token)). It can also not be a negative number if the [Global Setting](#global-settings) for "Allow negative numbers" is not selected. All symbols except numbers will be removed to maintain a compatible value.**

##### Temporary Hitpoints

Temporary Hitpoints follow these rules:

+ Adding temporary hitpoints increases the current hitpoint maximum as well as the current hitpoints.
+ Once temporary hitpoints are active, decreasing normal hitpoints removes the same amount of temporary hitpoints. E.g. if a token has 5 temporary HP, and takes 3 HP damage, the temporary HP are now at 2.

##### Initializing Token

To initialize a Token there are two approaches:

**TTRPG-API Statblocks**

If you are using a creature that is available on ttrpg-api.bitperfect-software.com you can use the [statblock feature](#statblock). The statblocks from the TTRPG API include most of the statblocks that use the OGL. This includes DnD 5e and Pathfinder 2E statblocks. For switching between rulesets see [global settings](#global-settings).

**Manual Initialization**

When initializing manually you enter the 4 available fields manually. Normally the HP value cannot exceed the maxHP value but while maxHP is still 0 entering the HP value also sets the maxHP value. This allows for a quick initialization by pressing Tab to jump between the input fields.

#### Statblock

The statblock offers a search field for creature statblocks on ttrpg-api.bitperfect-software.com. By default the Token Name is used to make an initial search. If the Token name has a modifier like A, B, A1, C, 1, 3, or similar at the end it will be automatically ignored for the search.

All results for the current search are displayed with their HP, AC and CR visible.

![Statblock Search](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_search.png)

By clicking on one of the options this statblock is selected for the Token. If there are no values set for the Token, the values of the creature statblock are automatically used. 

![Statblock Selected](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_selected.png)

The statblock shows all the creature information including available spells and detailed spell information.

#### Player Action Window

![Player Action Window](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/player_action_window.png)

The Player Action Window has reduced functionality compared to the GM Action Window. Tokens that have either the HP Bar or Player Visibility enabled show up in this window. Tokens that are invisible (hidden) within the scene don't show up here!

For tokens that have the Player Visibility set, their name change option, values, and statblock are shown. Otherwise just the dynamic-color background is there to indicate the current status of the creature.

Tokens don't follow the drag and drop order in the [GM Action Window](#hp-tracker-action-window). But when activated in the [Settings](#global-settings) Tokens will be ordered by their initiative value, disregarding which group they belong to.

### HP Tracker Context Menu

The HP Tracker Context Menu comes in two versions depending on how many tokens are selected.

#### Single Selection

The HP Tracker Context Menu is a simplified version of the Action Window [Token](#token)

For the GM all options except name and statblock are available:

![Popover GM](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/popover_gm.png)

For the Players, only tokens that have Player Visibility enabled will show this popover, but the Toggle buttons are not available.

![Popover Player](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/popover_player.png)

#### Multi Selection

When multiple Tokens are selected, the names of the selected tokens is displayed as well as their general state (background color). And Options to either heal or damage all of them at once. For GMs there is also the options to change the visibility settings for all Tokens at once.

![Popover Multiselect](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/popover_multi_select.png)

This can be used to do AoE damage or healing without entering the values for each Token. This also handles tempHP, maxHP, allowed negative values and every other system in HP Tracker automatically.

![Popover Multiselect](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/multiselect_demo.gif)

### HP Tracker statblock popover

Every Token that has a statblock assigned automatically shows up in the Statblock Popover.

The Popover contains two window buttons:

+ Minimize: Reduces the height of the popover to 100px.
+ Close: Closes the Popover

The Popover displays all available statblocks indicating which statblock is currently displayed in detail.

![Statblock Popover](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_popover.png)

By default when selecting a Token either in the [HP Tracker Action Window](#hp-tracker-action-window) or in the Scene. The associated statblock of the selected Token is displayed. This can be prevented by "pinning" a statblocks. While pinned no automatic switching is done even when another statblock is selected. To reactivate automatic switching unselect the pin on the currently active statblock.

![Statblock Demo](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_demo.gif)