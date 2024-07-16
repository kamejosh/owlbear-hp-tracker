# Contents

- [HP Tracker - Owlbear Plugin](#hp-tracker-owlbear-plugin)
- [Quickstart](#quickstart)
- [How it works](#how-it-works)
  + [Adding Tokens to the HP Tracker](#adding-tokens-to-the-hp-tracker)
  + [Hp Tracker Action Window](#hp-tracker-action-window)
    - [Version Information and Help Buttons](#version-information-and-help-buttons)
    - [Settings](#settings)
    - [Token List](#token-list)
    - [Token](#token)
      * [Toggle Buttons](#toggle-buttons)
      * [Changing Values](#changing-values)
      * [Temporary Hitpoints](#temporary-hitpoints)
      * [Initializing Token](#initializing-token)
    - [Statblock](#statblock)
      - [Limited Abilities](#limited-abilities)
    - [Player Action Window](#player-action-window)
  + [Hp Tracker Context Menu](#hp-tracker-context-menu)
    - [Single Selection](#single-selection)
    - [Multi Selection](#multi-selection)
  + [Statblock Popover](#hp-tracker-statblock-popover)
- [Custom Statblocks](#custom-statblocks)
- [Dice Roller](#dice-roller)
  + [Disclaimer](#disclaimer)
  + [Getting Started](#getting-started)
  + [Login into dddice](#login-into-dddice)
  + [Dice Settings](#dice-settings)
    - [Dice Theme](#dice-theme)
    - [dddice Room](#dddice-room)
    - [3D Rendering](#3d-rendering)
  + [Using The Dice Roller](#using-the-dice-roller)
    - [Dice Buttons in Statblocks](#dice-buttons-in-statblocks)
    - [Initiative Buttons](#initiative-buttons)
    - [Custom Roll Buttons](#custom-roll-buttons)
    - [Quick Roll Buttons](#quick-roll-buttons)
  + [DnD Beyond Dice Rolls](#dnd-beyond-dice-rolls)
  + [Simple Dice-Calculator](#simple-dice-calculator)

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
+ Drop all the PC Tokens you need and fill in their info (or create custom statblocks for your PC).
+ Drop an Ogre and Hobgoblin Token on scene and connect them with their statblocks (this will be done automatically for all statblocks where a matching entry is found)
+ Copy the Hobgoblin Token four times
+ Roll initiative for the whole group and sort by initiative
+ Start combat

## Video Example

Because the documentation currently requires gif for moving content the quality and length is limited, for better video quality consider going to the owlbear discord.

![HP Tracker Quickstart](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/quickstart.gif)

# How it works

The extension has three windows:

+ [HP Tracker Action Window](#hp-tracker-action-window) 
+ [HP Tracker Context Menu](#hp-tracker-context-menu)
+ [HP Tracker Statblock Popover](#hp-tracker-statblock-popover)

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

At the top of the action window the current version of the extension is displayed as well as the link to the Tabletop Alamanac (to create custom statblocks), three system buttons, the statblock popover button, a link to the HP Tracker Patreon page, and a link to the HP Tracker/Tabletop Alamanac Discord. 

The system buttons open a new modal (changelog and help are opened in fullscreen mode):
+ The [⛭] buttons opens the [Settings](#settings).
+ The [i] button opens the changelog so you can see recent changes
+ The [?] button opens the help menu which displays the same help information you are currently reading

The statblock popover button opens a popover, for more information see [here](#hp-tracker-statblock-popover).

The TA Link, Patreon Link and Discord Link open in a new window.

#### Settings

Settings are grouped into two categories:

+ Room Settings - affecting all scenes in the current room
+ Scene Settings - affecting only the current scene

##### Room Settings

![Room Settings](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/room_settings.png) 

The following settings are available:

+ Statblock Game Rules: You can choose between DnD 5e and Pathfinder 2e as source for your statblocks. This will impact what statblocks are found, how they are displayed, and the content (including spells).
+ Tabletop Almanac API Key: Here you can enter the Tabletop Almanac API Key to access your custom statblocks
+ HP Bar Segments: This setting can be used to obfuscate the real HP loss of a creature. E.g. when set to "2" the HP Bar differentiates between 3 states: Full HP, less than half HP, and 0 HP. When changing the settings HP Bars are not updated until the HP value is changed at least once.
+ Text and Bar Offset: To have a more flexible positioning of the HP Bar and Text, a value can be entered (negative or positive number) and the position of the HP Bar and Text is then adjusted by this value.
+ Armorclass Icon and Text Offset: To have a more flexible positioning of the AC Background and Text an offset for the X- and Y-Axis can be added. This value is scaled considering the Token size. 
+ Use calculated rolls (no 3D dice): By default the dice roller is enabled if you don't want to use dddice for dice rolling you can activate this option and an integrated dice roller will be used. This makes dice rolling faster because the calculation is done locally but you will not see beautiful 3D rendered dice.
+ Allow negative HP/AC: By default negative HP and AC are not allowed but when this settings is checked then HP and AC can be set to negative numbers. The HP Bar will always display negative HP the same as when it is 0.
+ Sort Tokens in Player View: When active, the [Player Action Window](#player-action-window) will display Tokens ordered by their initiative value. If not active, Tokens will have the same order as they were added to the scene (so kind of random).
+ Set Initiative Dice: This setting decides with which "dice" the roll initiative button in the groups and the token works. The default is 20, meaning a value from 1 to 20 (excl. modifiers) can be rolled. By setting it to 10 the value can only range from 1 to 10. When using 3D dice only values that are available in the selected theme should be used.
+ Statblock Popover dimensions: This settings allows to set the width and height of the statblock popover. The default is 600x500. When changing the value (either press enter or move cursor outside of input field) while the statblock popover is open the size of the open statblock popover is automatically adjusted so you can preview what size fits you. The width and height cannot be lower than 200 and settings bigger than the viewport will be overwritten by the max viewport size.
+ Don't show Changelog on updates: This will disable the automatic popup when a new version of HP Tracker is loaded. If not selected a notification will be shown once the update process has been finished and the changelog icon will flash for 30 seconds to indicate that there are new changes available.

##### Scene Settings

![Scene Settings](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/scene_settings.png)

+ Groups: This setting allows you to define different Groups used for ordering Tokens. There is a permanent "Default" group. The groups can be rearranged by dragging and dropping them in the desired order. To add a group use the text input below the group list. Press "Enter" to add a group to the list. Tokens in the HP Tracker remember their group association (if the group is deleted) but are added into the default group until they are moved to a different group. So deleting and re-adding the same group restores the previously associated tokens to that same group.

#### Token List

![Action Window Token List](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_token_list.png)

The Token List consists of the column headings, groups and tokens associated with each group. HP Tracker remembers which groups are open or collapsed between sessions. Collapsing a group hides the tokens it contains in the list, but they are still tracked by the HP Tracker and the [Popover](#hp-tracker-popover) is still available.

When clicking the button next to INIT in the header all Tokens will be ordered by there initiative value. This is done per group so Tokens in different groups will not be changing positions. Once clicked the button changes direction and now orders the tokens from smallest to biggest value.

Tokens can be moved between groups or reordered inside a group by dragging and dropping. By default this has no effect on the [Player Action Window](#player-action-window) but when the [setting](#settings) "Sort in Player View" is active, the Tokens in the Player Action Window are **sorted by their initiative value regardless of group**.

When a selected Token is moved all selected Tokens in the same group are moved as well.

![token_list_dnd](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/token_list_dnd.gif)

Clicking a token results in the corresponding item in the scene to be selected. To Select multiple tokens hold "SHIFT", "CTRL", or "CMD" and click token names in the list. Just like in other programs, holding "SHIFT" and clicking a Token selects all Tokens between the clicked and the nearest selected Token. 

Selecting token names in this way causes the Owlbear Token Contextmenu to open. When selecting multiple tokens names only the context menu for the first selected token is opened, but all items are selected.

![token_list_select](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/token_list_select.gif)

Double-clicking a token focuses the scene on the corresponding icon:

![token_list_dblclk](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/token_list_dblclk.gif)

#### Token

![Action Window Token](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_token.png)

A token in the HP Tracker represents a single Owlbear Item where the HP Tracker Extension has been activated. It consists of the following parts:

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
+ Rolling Initiative: When clicking the Initiative Button a random number between 1 and the chosen [Initiative Dice](#settings) (default: 20) is rolled and the dexterity modifier (5e) or perception (pf2e) from the [Statblock](#statblock) (if selected) is added and entered as the final initiative value. You can also change the initiative bonus to any number, once a statblock is assigned. By default a 3D dice is rolled to determine the random value.

**Note: The HP value can never exceed the maxHP value ([except when maxHP is 0](#initializing-token)). It can also not be a negative number if the [Setting](#settings) for "Allow negative numbers" is not selected. All symbols except numbers will be removed to maintain a compatible value.**

##### Temporary Hitpoints

Temporary Hitpoints follow these rules:

+ Adding temporary hitpoints increases the current hitpoint maximum as well as the current hitpoints.
+ Once temporary hitpoints are active, decreasing normal hitpoints removes the same amount of temporary hitpoints. E.g. if a token has 5 temporary HP, and takes 3 HP damage, the temporary HP are now at 2.

##### Initializing Token

To initialize a Token there are two approaches:

**TTRPG-API Statblocks**

If you are using a creature that is available on ttrpg-api.bitperfect-software.com you can use the [statblock feature](#statblock). The statblocks from the TTRPG API include most of the statblocks that use the OGL. This includes DnD 5e and Pathfinder 2E statblocks. For switching between rulesets see [Settings](#settings).

**Manual Initialization**

When initializing manually you enter the 4 available fields manually. Normally the HP value cannot exceed the maxHP value but while maxHP is still 0 entering the HP value also sets the maxHP value. This allows for a quick initialization by pressing Tab to jump between the input fields.

#### Statblock

The statblock offers a search field for creature statblocks on api.tabletop-almanac.com. By default the Token Name is used to make an initial search. If the Token name has a modifier like A, B, A1, C, 1, 3, or similar at the end it will be automatically ignored for the search.

All results for the current search are displayed with their HP, AC and CR visible.

![Statblock Search](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_search.png)

Available Statblocks have varying background depending on their source. Custom Statblocks created on tabletop-almanac.com are displayed first and with a slight green background. The currently selected statblock has a white glow.

By clicking on one of the options this statblock is selected for the Token. If there are no values set for the Token or the Token still has its automatically assigned values, the values of the creature statblock are automatically used. 

![Statblock Selected](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_selected.png)

The statblock shows all the creature information including available spells and detailed spell information.

##### Limited Abilities

[Custom Statblocks](#custom-statblocks) can define limited abilities (see [this video](https://www.youtube.com/watch?v=injiQlxv5Fc) tutorial). These limited abilities allows to track how many uses are left and when those limits are refilled. This can be used for Death Saves, Spellslots, Actions, Abilities, Hitdice and whatever you can think of.

There are a few automations in place to make tracking easier. 

+ If an ability has a "to hit" button this button will automatically mark off one use after clicking. 
+ If no "to hit" button is available any other dice button will mark off one use after clicking.
+ All spells include a "cast" button (if spellslots are defined) that mark of one use after clicking (but the to rules above are still true).

In future versions there will be buttons to allow automatically refill all uses with the matching reset rule.

Buttons that trigger uses being consumed will indicate that no uses are left by being highlighted. The buttons will still work while being highlighted.

To create custom statblocks go to [Tabletop Almanac](https://tabletop-almanac.com?ref=hp-doc) and create a free account.

![Statblock Limits](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_limits.png)

#### Player Action Window

![Player Action Window](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/player_action_window.png)

The Player Action Window has reduced functionality compared to the GM Action Window. Tokens that have either the HP Bar or Player Visibility enabled show up in this window. Tokens that are invisible (hidden) within the scene don't show up here!

For tokens that have the Player Visibility set, their name change option, values, and statblock are shown. Otherwise just the dynamic-color background is there to indicate the current status of the creature.

Tokens don't follow the drag and drop order in the [GM Action Window](#hp-tracker-action-window). But when activated in the [Settings](#settings) Tokens will be ordered by their initiative value, disregarding which group they belong to.

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

# Custom Statblocks

Custom statblocks can be created at tabletop-almanac.com. Free accounts can create up to 20 statblocks and activate 10 statblocks at the same time. To increase this limit go to my patreon and consider supporting me.

# Dice Roller

Starting with Version 1.6.0 HP Tracker comes with an integrated dice-roller. It can be disabled (removed) by changing the [Disable Dice Roller Setting](#room-settings);

![Dice Roller](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/dice_roller_log.png)

## Getting Started

By default HP Tracker uses the same account and room that dddice uses. So if you were already using dddice everything is setup. If you were not using the dddice extension you will be given a guest account and start a new dddice room. You should be able to start rolling dice after a few seconds where everything is setup.

If you are using a guest account, the username that will appear under your rolls will be your owlbear username (or owlbear guest name). If you are logged in with you dddice account your dddice username will be used.

You can now click on any dice button in your [statblocks](#statblock) and the dice will automatically roll.

## Login into dddice

The login process is the same with the official dddice extension (as this integration was done with their help). When you open the roll log (scroll button on the bottom of the Action Window) you will se a Login Button on the top left of the Roll Log. When you click this Button an overlay appears. Just click the purple link and you are done. It might take a few seconds to register the login. If the overlay doesn't disappear after 5 seconds you were already authenticated, if that is not the case please [let me know](https://github.com/kamejosh/owlbear-hp-tracker/issues).

## Dice Settings

When the Roll Log is open there is a settings button on the top right side of the roll log.

![Statblock Buttons](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/roll_settings.png)

There are currently two settings:

### Dice Theme

Each Owlbear user can chose their own dice theme (and the other users will see them roll with this theme). When logged in the dropdown menu list all compatible dice themes (theme has d4, d6, d8, d10, d12 and d20 with matching labeling) will be shown. Users can switch between those themes. Guest users only have access to the default dddice theme (bees).

### dddice Room

You can change the dddice room you want to use directly in this settings menu. Just select the room you want and every player will automatically join this room as well.

### 3D Rendering

You can choose to use the 3D rendering of dddice, this is the default option. Should you already use the dddice owlbear extension you might want to turn HP Trackers dice rendering off to not have multiple dice showing the same thing.

## Using The Dice Roller

There are multiple ways to use the dice roller:

+ Dice Buttons in Statblocks
+ Initiative Buttons
+ Custom Roll Buttons
+ Quick Roll Buttons

### Dice Buttons in Statblocks

Each rollable element inside a statblock is replaced by a dice button. Some of them might not make sense but the rule is as long as the text can be transformed to a rollable string it will be rollable.

![Statblock Buttons](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_buttons.png)

While hovering over a dice button the little dice inside the button begins to shake and a list of optional parameters is shown.

These optional parameters are:

+ ADV
  + changes the dice roll to 2d20kh1 (roll 2 d20 and keep the highest one) + modifier
+ DIS
  + changes the dice roll to 2d20dh1 (roll 2 d20 and drop the highest one) + modifier
+ HIDE
  + Dice roll will only be visible for you other people will not be notified and it will not show up in their dice log

![Dice Button Hover](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/dice_button_hover.png)

ADV and DIS are only available on d20s HIDE is available on all dice.

When rolling Dice Buttons in statblocks the dice context is set as meaningful as possible. This means attack rolls usually contain the attack name and "To Hit", and Damage rolls usually contain the attack name and "Damage". This is not always possible but should be close enough.

### Initiative Buttons

Initiative Buttons can be used to roll for an individual entry or for the whole group. When rolling for the whole group a roll is triggered for each token in the group and will show up as individual roll in the roll log.

![Dice Button Hover](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/initiative_roll.gif)

### Custom Roll Buttons

At the Bottom of HP Tracker there are 8 freely assignable buttons where you can create your custom presets. You can see the documentation for custom dice rolls [here](https://docs.dddice.com/guides/roll20.html#roll-equation-compatibility).
To get started click on a button with the "+" sign. A text input is opened where you can add your roll preset, if the preset is not valid the text input will be red. The dice roll will not be saved until a valid string has been found. To save the custom string press Enter or the "√"-button.

Custom Roll Buttons are automatically assigned with dddice Dice Box presets where one dice is assigned to a free custom dice button. All already prepared custom dice buttons get no value assigned.

You can also choose a different theme than the main theme for your custom dice button by selecting the theme from the theme selector

![Custom Roll Buttons](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/custom_roll_theme.png)

Once the preset has been saved the button will show up to 4 parts of the dice equations to make it easier to identify which button does what. It will also display the full dice command when hovering over the button.

To remove a preset hover over the button and press the now visible x-button in the top left corner. This delete button is off to the side and really small by design to make accidentally pressing it on mobile harder.

![Custom Roll Buttons](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/custom_roll_buttons.gif)

**Custom Dice Buttons are saved to your browsers localstorage. This means they will not be available on other devices or other browsers. Or you have to set them up there as well.**

### Quick Roll Buttons

The Quick Roll Buttons is the button next to the Roll Log toggle button. It will always display all available dice in the selected theme to quickly roll them. It also contains a text input field where you can enter a valid dice string and roll it without saving it.

![Quick Roll Buttons](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/quick_roll_buttons.gif)

## DnD Beyond Dice Rolls

Using dddice you can roll dice in your DnD Beyond Character Sheets and see those rolls directly in Owlbear Rodeo. All you have to do is:

- Install the dddice browser extension
- Open your DnD Beyond Character Sheet in this browser
- Open the Dice Log in HP Tracker
- Copy the link to the dddice room
- Paste this link into the dddice browser extension (you must be in the DnD Beyond tab)
- start rolling

## Simple Dice-Calculator

When in the [Settings](#room-settings) the option "Use calculated rolls" is activated, dddice is disabled. HP Tracker will then use a local script to calculate the result of the chosen dice-roll and use the OBR broadcast API to notify all connected players of the result.

The simple dice-calculator uses the [rpg-dice-roller](https://dice-roller.github.io/documentation/) package under the hood. Available dice notations for custom dice buttons and the quickroll function can be found [here](https://dice-roller.github.io/documentation/guide/notation/).
