<details>
  <summary style="font-size:1.5rem;font-weight:bold;">Table of Content</summary>
  <ul>
    <li><a href="#game-masters-grimoire---owlbear-plugin">Game Master's Grimoire - Owlbear Plugin</a></li>
    <li><a href="#quickstart">Quickstart</a></li>
    <li><a href="#how-it-works">How it works</a></li>
    <ul>
      <li><a href="#adding-tokens-to-the-game-masters-grimoire">Adding Tokens to the Game Master's Grimoire</a></li>
      <li><a href="#game-masters-grimoire-action-window">Game Master's Grimoire Action Window</a></li>
      <ul>
        <li><a href="#version-information-and-help-buttons">Version Information and Help Buttons</a></li>
        <li><a href="#settings">Settings</a></li>
        <li><a href="#token-list">Token List</a></li>
        <li><a href="#group">Group</a></li>
        <li><a href="#token">Token</a></li>
        <ul>
          <li><a href="#map-button">Map Button</a></li>
          <li><a href="#changing-values">Changing Values</a></li>
          <li><a href="#temporary-hitpoints">Temporary Hitpoints</a></li>
          <li><a href="#initializing-token">Initializing Token</a></li>
        </ul>
        <li><a href="#statblock">Statblock</a></li>
        <ul>
          <li><a href="#limited-abilities">Limited Abilities</a></li>
        </ul>
        <li><a href="#player-action-window">Player Action Window</a></li>
      </ul>
      <li><a href="#game-masters-grimoire-context-menu">Game Master's Grimoire Context Menu</a></li>
      <ul>
        <li><a href="#single-selection">Single Selection</a></li>
        <li><a href="#multi-selection">Multi Selection</a></li>
      </ul>
      <li><a href="#statblock-popover">Statblock Popover</a></li>
    </ul>
    <li><a href="#custom-statblocks">Custom Statblocks</a></li>
    <li><a href="#dice-roller">Dice Roller</a></li>
    <ul>
      <li><a href="#getting-started">Getting Started</a></li>
      <li><a href="#dddice-login">dddice Login</a></li>
      <li><a href="#dice-settings">Dice Settings</a></li>
      <ul>
        <li><a href="#dice-theme">Dice Theme</a></li>
        <li><a href="#dddice-room">dddice Room</a></li>
        <li><a href="#3d-rendering">3D Rendering</a></li>
      </ul>
      <li><a href="#using-the-dice-roller">Using The Dice Roller</a></li>
      <ul>
        <li><a href="#dice-buttons-in-statblock">Dice Buttons in Statblocks</a></li>
        <li><a href="#initiative-buttons">Initiative Buttons</a></li>
        <li><a href="#custom-roll-buttons">Custom Roll Buttons</a></li>
        <li><a href="#quick-roll-buttons">Quick Roll Buttons</a></li>
      </ul>
      <li><a href="#dnd-beyond-dice-rolls">DnD Beyond Dice Rolls</a></li>
      <li><a href="#simple-dice-calculator">Simple Dice-Calculator</a></li>
    </ul>
  </ul>
</details>

<h1 id="game-masters-grimoire---owlbear-plugin">Game Master's Grimoire - Owlbear Plugin</h1>

Designed for DnD 5e and PF2e this extension allows tracking and changing Players and Creatures' settings and statblocks while dynamically hiding and showing this information to players.

[Check out the Tutorial](https://youtu.be/uEWr6qooAK8)

![hp-tracker example](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/GameMastersGrimoire.png)

<h1 id="quickstart">Quickstart</h1>

This section is intended to describe and show an example of how fast a combat sequence can be setup using Game Master's Grimoire (GMG).

<h2 id="scenario">Scenario</h2>

Your players rest at a campsite, but they fell asleep during their watch and were surprised by an Ogre and five Hobgoblins. We quickly roll initiative sort the Tokens so we know whose turn is next and start doing damage.

<h2 id="how">How</h2>

+ Create a new scene based on a map you have in your collection. 
+ Drop all the PC Tokens you need and fill in their info (or create custom statblocks for your PC).
+ Drop an Ogre and Hobgoblin Token on scene and connect them with their statblocks (this will be done automatically for all statblocks where a matching entry is found)
+ Copy the Hobgoblin Token four times
+ Roll initiative for the whole group and sort by initiative
+ Optional:
  + Activate the participating groups for battle 
  + Start the battle using the "Start Battle"-Button
  + Use The "Next" or "Back" button to circle through the battle participants and highlight the current token.

<h2 id="video-example">Video Example</h2>

Because the documentation currently requires gif for moving content the quality and length is limited, for better video quality consider going to the discord.

![Game Master's Grimoire Quickstart](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/quickstart.gif)

<h1 id="how-it-works">How it works</h1>

The extension has three windows:

+ [Game Master's Grimoire Action Window](#game-masters-grimoire-action-window) 
+ [Game Master's Grimoire Context Menu](#game-masters-grimoire-context-menu)
+ [Game Master's Grimoire Statblock Popover](#game-masters-grimoire-statblock-popover)

As well as the following on-scene information:

+ HP Bar
+ HP Text
+ AC Text
+ Token Highlight (battle)

<h3 id="adding-tokens-to-the-game-masters-grimoire">Adding Tokens to the Game Master's Grimoire</h3>

Tokens that have not yet been added to the GMG have the following icon present when their context menu is open (right click on token):

![Context Menu](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/context_menu.png)

Clicking this icon adds the token to the GMG and you can see its name appear in the extension's Action window. You can select multiple tokens and activate them all at once. 
When first clicked all the initial information is added to the tokens metadata, by default the name of the token is used, to make loading [statblocks](#statblock) easier. If the token has a label, this value is taken instead. GMG ignores name postfixes like "A" or "A1" when searching for statblocks.

Once the GMG is active you can remove the token from the GMG again by clicking the Deactivate GMG Icon in the Context Menu:

![Context Menu 2](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/context_menu2.png)

This does not remove the Tokens metadata so in case you want to reactivate the GMG all previous information is still stored with the token.

Once a Token is deleted from a scene all the attached metadata is also removed so this cannot be undone.

In case you have a creature token multiple times within the same scene, it's easiest to setup one token and then copy it as often as you need, because the GMG information will be copied as well. This saves a lot of time when setting up scenes.

<h3 id="game-masters-grimoire-action-window">Game Master's Grimoire Action Window</h3>

The Action Window can be opened by clicking the GMG Action Icon in the Owlbear scene. It is meant as a place for the GM to setup his scene and creatures in it. It is also available for players in a simplified form see [Player Action Window](#player-action-window);

<h4 id="version-information-and-help-buttons">Version Information and Help Buttons</h4>

![Action Window Top](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_top.png)

At the top of the action window the current version of the extension is displayed as well as the link to the Tabletop Almanac (to create custom statblocks), three system buttons, the statblock popover button, a link to the GMG Patreon page, a link to the GMG/Tabletop Almanac Discord, and the [Token List Buttons](#token-list-buttons).  

The system buttons open a new modal:
+ The [⛭] buttons opens the [Settings](#settings).
+ The [i] button opens the changelog so you can see recent changes
+ The [?] button opens the help menu which displays the same help information you are currently reading

The statblock popover button opens a popover, for more information see [here](#game-masters-grimoire-statblock-popover).

The TA Link, Patreon Link and Discord Link open in a new window.

<h5 id="token-list-buttons">Token List Buttons</h5>

The Token List Buttons are always visible and stick to the upper left corner, even while scrolling down and consist of two parts:

+ The Token List Settings
+ The Battle Buttons

The Token List Settings consist of the "Player Preview Toggle"-Button and the "Sort by Initiative"-Section. When the "Player Preview" is active, the Token Images in the Token List display an approximation of what players will see (HP Bar, HP Text, AC). 

When the Sort by Initiative Checkbox is active you can choose between ascending and descending to automatically sort all tokens in all groups by initiative. New Tokens added to a group will also automatically be sorted by initiative. You will still be able to sort Tokens manually if they have the same initiative value and the same initiative bonus.

When the auto sorting toggle is deactivated you can sort the Tokens in any order you want by manually dragging them into their position.

The Battle Buttons come in two versions:

+ No battle active
+ Active battle

When no battle is active the "Start battle" button can be used to start a battle. But only if a [group](#group) is marked to participate in a battle and this group contains Tokens. If no group or token is ready for battle the button is disabled and has a red background. A tooltip explains why no battle is currently possible.

When an active battle is going on then this section displays

<h4 id="settings">Settings</h4>

Settings are grouped into three categories:

+ Room Settings - affecting all scenes in the current room
+ Scene Settings - affecting only the current scene
+ Tabletop Almanac Settings - only available on [TA](https://tabletop-almanac.com)

<h5 id="room-settings">Room Settings</h5>

![Room Settings](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/room_settings.png) 

The following settings are available:

+ Statblock Game Rules: You can choose between DnD 5e and Pathfinder 2e as source for your statblocks. This will impact what statblocks are found, how they are displayed, and the content (including spells).
+ Tabletop Almanac API Key: Here you can enter the Tabletop Almanac API Key to access your custom statblocks
+ HP Bar Segments: This setting can be used to obfuscate the real HP loss of a creature. E.g. when set to "2" the HP Bar differentiates between 3 states: Full HP, less than half HP, and 0 HP. When changing the settings HP Bars are not updated until the HP value is changed at least once.
+ Disable HP Bar: In case you don't want to display any HP Bar you can check this setting here.
+ Text and Bar Offset: To have a more flexible positioning of the HP Bar and Text, a value can be entered (negative or positive number) and the position of the HP Bar and Text is then adjusted by this value.
+ Armorclass Icon and Text Offset: To have a more flexible positioning of the AC Background and Text an offset for the X- and Y-Axis can be added. This value is scaled considering the Token size. 
+ Use calculated rolls (no 3D dice): By default the dice roller is enabled if you don't want to use dddice for dice rolling you can activate this option and an integrated dice roller will be used. This makes dice rolling faster because the calculation is done locally but you will not see beautiful 3D rendered dice.
+ Allow negative HP/AC: By default negative HP and AC are not allowed but when this settings is checked then HP and AC can be set to negative numbers. The HP Bar will always display negative HP the same as when it is 0.
+ Sort Tokens in Player View: When active, the [Player Action Window](#player-action-window) will display Tokens ordered by their initiative value. If not active, Tokens will have the same order as they were added to the scene (so kind of random).
+ Set Initiative Dice: This setting decides with which "dice" the roll initiative button in the groups and the token works. The default is 20, meaning a value from 1 to 20 (excl. modifiers) can be rolled. By setting it to 10 the value can only range from 1 to 10. When using 3D dice only values that are available in the selected theme should be used.
+ Statblock Popover dimensions: This settings allows to set the width and height of the statblock popover. The default is 600x500. When changing the value (either press enter or move cursor outside of input field) while the statblock popover is open the size of the open statblock popover is automatically adjusted so you can preview what size fits you. The width and height cannot be lower than 200 and settings bigger than the viewport will be overwritten by the max viewport size.
+ Don't show Changelog on updates: This will disable the automatic popup when a new version of GMG is loaded. If not selected a notification will be shown once the update process has been finished and the changelog icon will flash for 30 seconds to indicate that there are new changes available.

<h5 id="scene-settings">Scene Settings</h5>

![Scene Settings](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/scene_settings.png)

+ Groups: This setting allows you to define different Groups used for ordering Tokens. There is a permanent "Default" group. The groups can be rearranged by **dragging and dropping** them in the desired order. To add a group use the text input below the group list. Press "Enter" to add a group to the list. Tokens in the GMG remember their group association (if the group is deleted) but are added into the default group until they are moved to a different group. So deleting and re-adding the same group restores the previously associated tokens to that same group.

<h4 id="token-list">Token List</h4>

![Action Window Token List](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_token_list.png)

The Token List consists of groups and tokens associated with each group. GMG remembers which groups are open or collapsed between sessions. Collapsing a group hides the tokens it contains in the list, but they are still tracked by the GMG and the [Popover](#game-masters-grimoire-context-menu) is still available.

Tokens can be moved between groups or reordered inside a group by dragging and dropping. By default, this has no effect on the [Player Action Window](#player-action-window) but when the [setting](#settings) "Sort in Player View" is active, the Tokens in the Player Action Window are **sorted by their initiative value regardless of group**.

When a selected Token is moved all selected Tokens in the same group are moved as well.

![token_list_dnd](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/token_list_dnd.gif)

Clicking a token results in the corresponding item in the scene to be selected. To Select multiple tokens hold "SHIFT", "CTRL", or "CMD" and click token names in the list. Just like in other programs, holding "SHIFT" and clicking a Token selects all Tokens between the clicked and the nearest selected Token. 

Selecting token names in this way causes the Owlbear Token Contextmenu to open. When selecting multiple tokens names only the context menu for the first selected token is opened, but all items are selected.

![token_list_select](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/token_list_select.gif)

Double-clicking a token focuses the scene on the corresponding icon:

![token_list_dblclk](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/token_list_dblclk.gif)

<h4 id="group">Group</h4>

GMG's groups offer a lot of functionality besides grouping tokens together. There are multiple reasons to consider groups:

+ For larger maps it makes sense to group creatures of areas together to keep a better overview
  + collapsing groups of creatures currently not seen by the players
  + keeping an overview over which creatures will be fighting in the next battle.
+ The group buttons allow you to change every token of the group at the same time
+ You want to keep a group as reserve not yet part of the initiative order and activate it once it's time

Each group shows the following things:

![Action Window Token List](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_groups.png)

1. Group name
2. Add to Battle Button: The sword is shown when a group is part of a battle, the white flag if it's not.
3. HP Map Button: Click to display HP on the map, right click to let players see the exact HP data
4. AC Map Button: Click to display AC on the map, right click to let players see AC data
5. Initiative Section: Click the button to toggle Tokens in the [Player Action Window](#player-action-window), click the dice button to roll Initiative for all tokens.
6. Rest Section: Click "short" to perform a short rest (currently only resets abilities). Click "long" to perform a long rest, which heals all tokens and resets their abilities (like spell slots).
7. Collapse Button: Click to show or hide tokens in the Action Window

<h4 id="token">Token</h4>

![Action Window Token](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/action_window_token.png)

A token in the GMG represents a single Owlbear Item where the GMG Extension has been activated. It consists of the following parts:

+ Dynamic Color Background (based on ratio between HP and max HP)
+ Player Preview
  + Shows an approximation what players will see
+ HP Section
  + Red Heart shows the current HP state
  + Blue Heart shows if temporary HP are active for a token
  + current HP / max HP on the top row
  + temp HP / [Map Button](#map-button) on the bottom row
+ AC Section
  + Input for the AC
  + [Map Button](#map-button)
+ Initiative Section
  + Input for the current initiative
  + Dice Button to roll Initiative (automatically sets the current initiative) with initiative bonus modifier
  + Input for initiative Bonus
    + Is automatically prefilled by the selected statblock (DEX modifier for DnD and perception value for PF2e)
  + Player List Button: When selected the token shows up in the [Player Action Window](#player-action-window)
+ Statblock Section
  + Open the assigned statblock or delete it
  + If no statblock is assigned open the statblock search
  + transfer token ownership to a player
    + If this is set, a square in the players color indicates that this token is assigned to a player
    + This player will have full access to the statblock
    + This player will see this token in their Player Action Window (no matter the Player List Button setting)
    + This works together with Smoke & Specter token ownership as it uses the base owlbear rodeo token ownership setting

A token that is selected in the scene has a white border. A token whose turn it is in the current battle has a red border.

<h5 id="map-button">Map Button</h5>

The Map Buttons allow you to add information to the owlbear rodeo scene and control its visibility for players. A left click either activates or deactivates the element on the scene (this is context based either HP or AC). A right click toggles the visibility for the players. If the button is generally deactivated then nobody can see the information.

<h5 id="changing-values">Changing Values</h5>

Values can be changed in a few different ways:

+ Arithmetic operations: for the HP field the value can be changed via arithmetic (+ and -) operations. If the current value is `"10"` and you edit the field like this `"10 + 3"` the field value will be changed to `"13"` once you select anything outside of the field or press enter.
+ Arrow Keys: when focus is on HP, maxHP, tempHP or AC you can increase or decrease the values by 1 by pressing up or down arrow key respectively
+ Entering a number: when focused on any field, you can delete its content and enter a new value. 
  + Note that changing the maxHP or tempHP field influences the HP field.
+ Rolling Initiative: When clicking the Initiative Button a random number between 1 and the chosen [Initiative Dice](#settings) (default: 20) is rolled and the dexterity modifier (5e) or perception (pf2e) from the [Statblock](#statblock) (if selected) is added and entered as the final initiative value. You can also change the initiative bonus to any number, once a statblock is assigned. By default a 3D dice is rolled to determine the random value.

**Note: The HP value can never exceed the maxHP value ([except when maxHP is 0](#initializing-token)). It can also not be a negative number if the [Setting](#settings) for "Allow negative numbers" is not selected. All symbols except numbers will be removed to maintain a compatible value.**

<h5 id="temporary-hitpoints">Temporary Hitpoints</h5>

Temporary Hitpoints follow these rules:

+ Adding temporary hitpoints increases the current hitpoint maximum as well as the current hitpoints.
+ Once temporary hitpoints are active, decreasing normal hitpoints removes the same amount of temporary hitpoints. E.g. if a token has 5 temporary HP, and takes 3 HP damage, the temporary HP are now at 2.

<h5 id="initializing-token">Initializing Token</h5>

To initialize a Token there are two approaches:

**Tabletop Almanac Statblocks**

If you are using a creature that is available on [Tabletop Almanac](https://tabletop-almanac.com) you can use the [statblock feature](#statblock). The statblocks from Tabletop Almanac include most of the statblocks that use the OGL. This includes DnD 5e and Pathfinder 2E statblocks. For switching between rulesets see [Settings](#settings).

**Manual Initialization**

When initializing manually you enter the 6 available fields manually. Normally the HP value cannot exceed the maxHP value but while maxHP is still 0 entering the HP value also sets the maxHP value. This allows for a quick initialization by pressing Tab to jump between the input fields.

<h4 id="statblock">Statblock</h4>

The statblock offers a search field for creature statblocks found in the [Tabletop Almanac](https://tabletop-almanac.com). By default, the Token Name is used to make an initial search. If the Token name has a modifier like A, B, A1, C, 1, 3, or similar at the end it will be automatically ignored for the search.

All results for the current search are displayed with their HP, AC and CR visible.

![Statblock Search](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_search.png)

Available Statblocks have varying background depending on their source. Custom Statblocks created on [Tabletop Almanac](https://tabletop-almanac.com) are displayed first and with a slight green background. The currently selected statblock has a white glow.

By clicking on one of the options this statblock is selected for the Token. If there are no values set for the Token or the Token still has its automatically assigned values, the values of the creature statblock are automatically used. 

![Statblock Selected](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_selected.png)

The statblock shows all the creature information including available spells and detailed spell information. At the top is a section with jump links, that lets you quickly navigate to the different statblock sections.

The Token Values section works the same as the [token](#token) in the Action Window.

<h5 id="limited-abilities">Limited Abilities</h5>

[Custom Statblocks](#custom-statblocks) can define limited abilities (see [this video](https://www.youtube.com/watch?v=injiQlxv5Fc) tutorial). These limited abilities allows to track how many uses are left and when those limits are refilled. This can be used for Death Saves, Spellslots, Actions, Abilities, Hitdice and whatever you can think of.

There are a few automations in place to make tracking easier. 

+ If an ability has a "to hit" button this button will automatically mark off one use after clicking. 
+ If no "to hit" button is available any other dice button will mark off one use after clicking.
+ All spells include a "cast" button (if spellslots are defined) that mark of one use after clicking (but the rules above are still true).

The rest buttons automatically refill limited abilities where the reset value has been set to short or long rest.

Buttons that trigger uses being consumed will indicate that no uses are left by being highlighted. The buttons will still work while being highlighted.

To create custom statblocks go to [Tabletop Almanac](https://tabletop-almanac.com?ref=hp-doc) and create a free account.

![Statblock Limits](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_limits.png)

<h4 id="player-action-window">Player Action Window</h4>

![Player Action Window](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/player_action_window.png)

The Player Action Window has reduced functionality compared to the GM Action Window. Tokens that have the [Player List](#token) Button active or are assigned to the player show up in this window. Tokens that are invisible (hidden) within the scene don't show up here, except for Tokens assigned to the current player and tokens where HP and AC are revealed to the player.

For tokens that have their HP and AC revealed to the players their values are shown. Tokens that are assigned to players also have an option to access the assigned statblock. Otherwise, just the dynamic-color background is there to indicate the current status of the creature.

Tokens don't follow the drag and drop order in the [GM Action Window](#hp-tracker-action-window). But when activated in the [Settings](#settings) Tokens will be ordered by their initiative value, disregarding which group they belong to.

<h3 id="game-masters-grimoire-context-menu">Game Master's Grimoire Context Menu</h3>

The GMG Context Menu comes in two versions depending on how many tokens are selected.

<h4 id="single-selection">Single Selection</h4>

The GMG Context Menu is a simplified version of the Action Window [Token](#token)

For the GM all options except rest and statblock are available. And Initiative can only be rolled without 3D dice:

![Popover GM](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/popover_gm.png)

For the Players, only tokens that they own will show this popover, but the [Map Buttons](#map-button) and Player List Button are not available.

<h4 id="multi-selection">Multi Selection</h4>

When multiple Tokens are selected, the names of the selected tokens are displayed as well as their general state (background color). And Options to either heal or damage all of them at once. For GMs there is also the options to change the visibility settings for all Tokens at once.

![Popover Multiselect](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/popover_multi_select.png)

This can be used to do AoE damage or healing without entering the values for each Token. This also handles tempHP, maxHP, allowed negative values and every other system in GMG automatically.

![Popover Multiselect](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/multiselect_demo.gif)

<h3 id="game-masters-grimoire-statblock-popover">Game Master's Grimoire statblock popover</h3>

Every Token that has a statblock assigned automatically shows up in the Statblock Popover. For Players only the tokens which they own show up in the Statblock Popover.

The Popover contains two window buttons:

+ Minimize: Reduces the height of the popover to 100px.
+ Close: Closes the Popover

The Popover displays all available statblocks indicating which statblock is currently displayed in detail.

![Statblock Popover](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_popover.png)

By default when selecting a Token either in the [Game Master's Grimoire Action Window](#game-masters-grimoire-action-window) or in the Scene. The associated statblock of the selected Token is displayed except when the statblock is collapsed. This can be prevented by "pinning" a statblocks. While pinned no automatic switching is done even when another statblock is selected. To reactivate automatic switching unselect the pin on the currently active statblock.

![Statblock Demo](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/statblock_demo.gif)

<h1 id="custom-statblocks">Custom Statblocks</h1>

Custom statblocks can be created on [Tabletop Almanac](https://tabletop-almanac.com). Free accounts can create up to 20 statblocks and activate 10 statblocks at the same time. To increase this limit go to my patreon and consider supporting me.

<h1 id="dice-roller">Dice Roller</h1>

GMG comes with an integrated dice-roller. It can be disabled (removed) by changing the [Disable Dice Roller Setting](#room-settings);

![Dice Roller](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/dice_roller_log.png)

<h2 id="getting-started">Getting Started</h2>

By default GMG uses the same account and room that dddice uses. So if you were already using dddice everything is setup. If you were not using the dddice extension you will be given a guest account and start a new dddice room. You should be able to start rolling dice after a few seconds where everything is setup.

If you are using a guest account, the username that will appear under your rolls will be your owlbear username (or owlbear guest name). If you are logged in with you dddice account your dddice username will be used.

You can now click on any dice button in your [statblocks](#statblock) and the dice will automatically roll.

<h2 id="dddice-login">dddice login</h2>

The login process is the same with the official dddice extension (as this integration was done with their help). When you open the roll log (scroll button on the bottom of the Action Window) you will se a Login Button on the top left of the Roll Log. When you click this Button an overlay appears. Just click the purple link and you are done. It might take a few seconds to register the login. If the overlay doesn't disappear after 5 seconds you were already authenticated, if that is not the case please [let me know](https://github.com/kamejosh/owlbear-hp-tracker/issues).

<h2 id="dice-settings">Dice Settings</h2>

When the Roll Log is open there is a settings button on the top right side of the roll log.

![Roll Settings](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/roll_settings.png)

There are currently two settings:

<h3 id="dice-theme">Dice Theme</h3>

Each Owlbear user can choose their own dice theme (and the other users will see them roll with this theme). When logged in the dropdown menu list all compatible dice themes (theme has d4, d6, d8, d10, d12 and d20 with matching labeling) will be shown. Users can switch between those themes. Guest users only have access to the default dddice theme (bees).

<h3 id="dddice-room">dddice Room</h3>

You can change the dddice room you want to use directly in this settings menu. Just select the room you want and every player will automatically join this room as well.

<h3 id="3d-rendering">3D Rendering</h3>

You can choose to use the 3D rendering of dddice, this is the default option. Should you already use the dddice owlbear extension you might want to turn HP Trackers dice rendering off to not have multiple dice showing the same thing.

<h2 id="using-the-dice-roller">Using The Dice Roller</h2>

By default all rolls are seen by all players. GMs can set their own roll to be hidden by default in the [Tabletop Almanac Settings](https://tabletop-almanac.com).

There are multiple ways to use the dice roller:

+ Dice Buttons in Statblocks
+ Initiative Buttons
+ Custom Roll Buttons
+ Quick Roll Buttons

<h3 id="dice-buttons-in-statblocks">Dice Buttons in Statblocks</h3>

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

Dice that are marked as Damage Dice have optional roll button:

+ CRIT
  + automatically rolls the damage as a crit based on the selected crit rules on [Tabletop Almanac](https://tabletop-almanac.com)

![Dice Button Hover](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/dice_button_hover.png)

ADV and DIS are only available on d20s HIDE is available on all dice and CRIT is only available on Damage Dice.

When rolling Dice Buttons in statblocks the dice context is set as meaningful as possible. This means attack rolls usually contain the attack name and "To Hit", and Damage rolls usually contain the attack name and "Damage". This is not always possible but should be close enough.

<h3 id="initiative-buttons">Initiative Buttons</h3>

Initiative Buttons can be used to roll for an individual entry or for the whole group. When rolling for the whole group a roll is triggered for each token in the group and will show up as individual roll in the roll log.

![Dice Button Hover](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/initiative_roll.gif)

<h3 id="custom-roll-buttons">Custom Roll Buttons</h3>

At the Bottom of GMG there are 8 freely assignable buttons where you can create your custom presets. You can see the documentation for custom dice rolls [here](https://docs.dddice.com/docs/integrations/roll20/#roll-equation-compatibility).
To get started click on a button with the "+" sign. A text input is opened where you can add your roll preset, if the preset is not valid the text input will be red. The dice roll will not be saved until a valid string has been found. To save the custom string press Enter or the "√"-button.

Custom Roll Buttons are automatically assigned with dddice Dice Box presets where one dice is assigned to a free custom dice button. All already prepared or once deleted custom dice buttons get no value assigned.

You can also choose a different theme than the main theme for your custom dice button by selecting the theme from the theme selector, this also includes themes not selectable as default theme.

![Custom Roll Buttons](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/custom_roll_theme.png)

Once the preset has been saved the button will show up to 4 parts of the dice equations to make it easier to identify which button does what. It will also display the full dice command when hovering over the button.

To remove a preset hover over the button and press the now visible x-button in the top left corner. This delete button is off to the side and really small by design to make accidentally pressing it on mobile harder.

![Custom Roll Buttons](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/custom_roll_buttons.gif)

**Custom Dice Buttons are saved to your browsers localstorage. This means they will not be available on other devices or other browsers. Or you have to set them up there as well.**

<h3 id="quick-roll-buttons">Quick Roll Buttons</h3>

The Quick Roll Buttons is the button next to the Roll Log toggle button. It will always display all available dice in the selected theme to quickly roll them. It also contains a text input field where you can enter a valid dice string and roll it without saving it.

<h2 id="dnd-beyond-dice-rolls">DnD Beyond Dice Rolls</h2>

Using dddice you can roll dice in your DnD Beyond Character Sheets and see those rolls directly in Owlbear Rodeo. All you have to do is:

- Install the dddice browser extension
- Open your DnD Beyond Character Sheet in this browser
- Open the Dice Log in GMG
- Copy the link to the dddice room
- Paste this link into the dddice browser extension (you must be in the DnD Beyond tab)
- start rolling

<h2 id="simple-dice-calculator">Simple Dice-Calculator</h2>

When in the [Settings](#room-settings) the option "Use calculated rolls" is activated, dddice is disabled. GMG will then use a local script to calculate the result of the chosen dice-roll and use the OBR broadcast API to notify all connected players of the result.

The simple dice-calculator uses the [rpg-dice-roller](https://dice-roller.github.io/documentation/) package under the hood. Available dice notations for custom dice buttons and the quickroll function can be found [here](https://dice-roller.github.io/documentation/guide/notation/).
