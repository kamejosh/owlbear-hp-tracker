# 3.0.0

+ HP Tracker is now called GM's Grimoire
  + There is so much more than just HP Tracking going on
  + It's a complete toolkit for Dungeon and Game Masters so the renaming was something that had to be done to reflect the state of the extension
+ There is a completely new Design for the token list 
  + It aims to simplify the core functionality and make everything accessible with a click
  + It comes with lots of tooltips to make it easier to know what things do and a lot more visual feedback what the current state is
+ Token Preview in the token list (including mode that shows what players see)
+ Dedicated map buttons that add HP or AC to the map and make them visible for players (right click or long press)
+ Initiative Bonus can now be directly set in the token list (and is visible in the roll button)
+ Tokens can now be assigned to players directly 
+ Short and Long Rest buttons that heal and reset limited statblock abilities.
+ Battle Round tracking (finally) that allows to keep track of who's turn it is across different groups with the click of a button
+ Code optimization for better performance
+ Statblock Popover now allows collapsing of statblocks for a better overview
+ Statblock Popover can now be opened directly from the token list
+ In Scene indicator who's turn it currently is
+ Custom Dice can now use themes not matching a full DnD set
+ And a few bug fixes along the way

# 2.3.1

+ Improve dddice Integration
  + dddice dice box is automatically assigned to custom dice buttons if custom dice buttons have no value assigned
  + custom dice buttons can now be set to use a different dice theme than the main dice theme
  + you can now switch dddice rooms directly from the Dice Settings
+ Fix crash when token data breaks
+ Add Critical Rolls to Damage Rolls for 5e and PF2

# 2.3.0

+ Add limited abilities to custom statblocks: [video](https://www.youtube.com/watch?v=injiQlxv5Fc)
+ Add new Spell and Statblock Fields from TA to HP Tracker
+ Fix some bugs
+ Token Owners are always able to access statblock an change stats
+ Fix issue when minimizing statblock popover
+ Give statblocks of owned tokens a border in the player color
+ make statblock name sticky
+ Fix HP Tracker showing hidden rolls from dddice

# 2.2.1

+ Improve dddice integration
  + When both HP Tracker and dddice extension are installed only one of those extension renders dice
  + HP Trackers roll log only appears after the dice are finished rolling
+ Fix dddice themes are not showing up
  + Now every dice theme that contains the basic DnD Dice can be selected
+ API Key field is now obfuscated by default
+ Dice Buttons now indicate if 3D dice are rolled or not
  + Button has a 3D effect and shows the selected dddice theme: dddice is used
  + Button has no 3D effect and shows vector drawing: calculated dice are used
+ Fix styling issue when having dddice themes with very long names in dicebox
+ Fix issue that Tokens are assigned the wrong statblock because search result contains too many results
+ Equal names now prefer wotc-srd statblocks
+ Fix hidden dice rolls are now also hidden when rolled from within the statblock

# 2.2.0

+ Add alternative dice roller
  + When deactivating dddice (Settings->Use calculated rolls) you can now use the built in dice roller
  + There is no 3D dice rendering
  + Results are calculate locally
  + Faster results but not so good looking
+ Initiative rolls are now rolled with bonus which makes the log display the entered value
+ Added "about"-field to statblocks 
+ 10x-20x performance improvement during idle
+ improved roll-log
  + default only the last 20 entries are shown
  + click more to load additional entries
  + older entries now display details on hover
  + The roll log now displays the Token name rather then the players name
+ Saving Throws and Skills that have a bonus of 0 are now displayed with +0 instead of not displayed at all (when bonus is empty they are still not displayed).
+ Fix HP Bar width has wrong calculation after scaling the token
+ All dddice themes with the standard 5e dice are now selectable

# 2.1.1

+ Reset dddice themes that are not available
+ Fix dddice initialization bug
+ Fix dddice 3d rendering settings needing a refresh
+ Increase time dicelog popover is shown
+ Add option to allow reversed initiative

# 2.1.0

+ Refactor dddice integration
  + Fix Safari issue not recognizing scroll events
  + Themes are now fetched directly from dddice account
+ Performance improvements

# 2.0.2

+ Fix Disadvantage rolls add a negative modifier with a "+".

# 2.0.1

+ Fix mobile browsers show an overlay background
+ Fix mobile styling of header

# 2.0.0

**Custom Statblocks are finally here register now at [tabletop-almanac.com](https://tabletop-almanac.com)** 

+ You can now create and use custom statblocks using [Tabletop Almanac](https://tabletop-almanac.com)
+ Reset all selected dice-themes to [dddice-bees](https://dddice.com/dice/dddice-bees). Because all other themes will only be available for dddice Patreon Supports see [here](https://blog.dddice.com/dddice-is-rolling-into-beta/#%F0%9F%9A%80-what-will-change).
+ Add auto statblock assignment when Activating HP Tracker
+ Smaller bug fixes and improvements

# 1.6.4

+ HP Tracker can be initialized without a scene 
+ Improve styling 

# 1.6.3

+ Make dice roller completely optional by disabling it in the settings
+ Auto adjust size of quick roll input
+ React to player role changes without needing to reload site
+ Add self-roll button to quickrolls
+ New users sometimes cannot use dice roller.

# 1.6.2

+ Add documentation for integrating DnDBeyond rolls into HP Tracker
+ Fix issue with initiative roller when dice were used
+ Add dice rendering is now a setting per player and can be changed without a restart
+ Fix custom roll text input could not be closed without entering a valid roll equation
+ Fix an open dice settings menu would prevent the dice tray from fully closing
+ Fix entering just "-" in the HP Bar Offset setting deletes it instantly

# 1.6.1

+ Fix issue where tokens could not be dragged over hidden groups
+ Fix issue when trying to rejoin a room as a guest
+ Move to general canvas to prevent multiple dice rolling in different windows
+ Modals no longer get the default background when starting
+ Fix Tokens that are attached to other Tokens no longer share their HP Tracker state
+ Add feedback for logged in user and implement logout

# 1.6.0

+ Add dice roller using dddice
+ Refactor Settings and split them into Room and Scene Settings
+ Update Changelog -> Changelog can now be hidden by default so it won't be displayed on updates any longer (you might miss new features)
+ Bugfixes:
  + Fix error where copied items or new tokens were not properly order for drag and drop
  + Improved base HP Tracker performance
  + Improve modal styling to not completely cover screen
  + Optimize Scene initialization to update the least amount of data possible

![Dice Roller Preview](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/roll_preview.gif)

# 1.5.2

+ Add multi-selection embedded context-menu 
  + damage and heal function for multiple selected tokens
  + toggle settings for multiple selected tokens

![Popover Multiselect](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/multiselect_demo.gif)

# 1.5.1

+ Improve statblock search user experience

# 1.5.0

+ Add Statblock Popover
+ Add Setting to change Statblock Popover dimensions
+ Fix styling issues in Statblocks
+ Refactor styling and help buttons
+ Add auto select of current statblock
+ Fix temp hp offset bug
+ Add Group Settings that apply to all Tokens in a group
+ Make Initiative dice customizable in Settings
+ Make Initiative Bonus customizable in Statblock
+ Add Multiselect and Multidrag to Tokenlist

# 1.4.6

+ Fix some styling issues on mobile and embedded
+ Fix negative numbers not always working
+ Fix PF2 and 5E Statblocks sometimes not loading the correct initiative modifier

# 1.4.5

+ Fix text color is black on some elements when system theme is set to light

# 1.4.4

+ Fix shapes are created correctly when Token is mirrored
+ Offset for Shapes and text is calculated without errors when Token is mirrored

# 1.4.3

+ Fix AC is automatically added to all tokens

# 1.4.2

+ Add Setting to toggle Token Sorting in the Player Action Window
  + When Sorting is active Tokens will be sorted by their Initiative value
  + When Sorting is inactive Tokens will appear in the same order as they were dropped into the scene
+ Small UI Improvements to make HP Tracker look the same in different browsers

# 1.4.1

+ Consider supporting me on [Patreon](https://patreon.com/TTRPGAPI?utm_medium=clipboard_copy&utm_source=copyLink&utm_campaign=creatorshare_creator&utm_content=join_link) so I can spend more time improving HP Tracker.
+ Rework Scene display of HP and AC
  + AC is not displayed above it's own shape
  + bot AC and HP Shapes and Text scale with token size
  + *If There are problems when loading the scene try to reload or toggle settings for items that are no properly displayed*
+ Improve update logic for more performance
+ Add Temporary Hitpoint Feature
  + Adding Temp HP automatically adds HP
  + losing HP automatically reduces Temp HP
  + Blue Bar to indicate that someone has temporary hitpoints.

# 1.4.0

### This update uses a new statblock backend. This means previously selected statblocks can't be accessed anymore and statblocks need to be relinked manually. Sorry for any inconvenience but this prepares HP Tracker for custom statblocks coming in one of the next versions.

+ Add ttrpg-api for e5 and pf
+ Migrate Info, Changelog and Settings to Modal
+ UI Improvements
  + Global Settings moved to Help Buttons
  + Help Buttons are fixed and can be accessed from anywhere in the Window
  + Small QoL improvements
+ Add Button to order Tokens by initiative
+ Search field removes Numbering extensions like "A", "B", "1", "2" from token names.

# 1.3.8

+ Update Owlbear SDK
+ Move Popover to embeded container

# 1.3.7

+ Fix error when trying to read HP Tracker version of uninitialized scene

# 1.3.6

+ Fix Drag And Drop on TokenList for new Scenes
+ Open changelog per default when a new version has been installed

# 1.3.5

+ Move domain to https://hp-tracker.bitperfect-software.com/manifest.json

# 1.3.4

+ Allow setting of HP before max HP if max HP is still 0. Setting HP this way also sets max HP (see `Initializing Token` in help window).

# 1.3.3

+ Fix documentation with the amazing help of Andrew

# 1.3.2

+ Fixed Context Menu Icons to only appear for Image Elements
+ Action Window and Text + HP Bar now consistently follow visible state of token
+ Fix help button styling for chrome and safari

# 1.3.1

+ Add better documentation/help

# 1.3.0

+ Reintroduce Popover to manage stats directly at the token
+ Add Token Grouping
+ Improve token highlighting and better selection feedback
+ Double click on Token Name focuses viewport von Token 
+ Add Changelog Button

# 1.2.1

+ Fix issue where HP Bar and Text would not disappear when hp tracker was set to inactive

# 1.2.0

+ Move from local Items to global Items because Owlbear handles them better out of the box
+ Now takes Token offset into consideration when placing HP Tracker Items
+ Visible State of HP Tracker Information now works as expected
+ HP Bar gets deleted if Token gets deleted
+ Existing Tokens now get their name assigned when HP Tracker Extension is added (didn't work previously)
+ HP can now be change via arithmetic operations

# 1.1.3

- Add Special Abilities to Monster Stat Block
- Fix that sometime when moving on the remote screen the Image height was calculated wrong
- Add global Setting to allow negative HP and AC
- Improvements for the mobile UI
- Fix wrong tooltips

# 1.1.2

- Fix global settings not being initialized

# 1.1.1

- Add Global Settings
  - Change HP Bar offset to position hp bar on the y axis
  - Change HP Bar Segments to define the maximum segments that the HP Bar has (fuzzy HP)

# 1.1.0

- Add Quality of Life features - HP are only changed when maxHP loses focus - AC are also right aligned - No resize of Name column on hover
- Add option to order the item in the HP Tracker (Player View stays unchanged)
- Add Initiative Tracker and Improve HP Bar visualization
- Resize HP Bar to match Token Size
- Search for Character Sheet on Open5e and link selected Monster
  - When Monster Info is linked and no values have been set Values from Sheet are taken
  - Dex modifier is added to Initiative Dice if Monster Info is linked
- Add Context Menu to increase and decrease directly at token

# 1.0.7

- Fix error when changing visible state

# 1.0.6

- Improve HP Bar handling and make icons easier to understand
- Add Highlighted Character to Playerview when HP Bar is active
- Removes changing values with mouse wheel due to bug with large numbers of items

# 1.0.5

- Fix issue on chrome where mouse over would always trigger value change after activating it once
  - mouse drag can no longer change values (thank google)
- buttons have proper cursor icon
- Fix layout not working for mobile

# 1.0.4

- Refactored the whole menu
  - Popover is no longer needed all settings are in the main window
  - HP indicator in Main window
  - HP Bar that can be toggled
  - Input via Mouse Drag/Wheel or Arrowkeys
- Lots of other imrovements that help with debugging

# 1.0.3

- Increase performance of local item handling
- Refactoring of update functions

# 1.0.2

- fix an error where HP is not refreshed in Main Window when changed in Popover
- fixed invisible state by moving the text to local scene
- handle move and visible state for local scene items
- refactoring and minor optical improvements

# 1.0.1

- fix error when extension finishes loading before scene: https://github.com/owlbear-rodeo/extensions/pull/23#issuecomment-1629997777


# 1.0.0

- release initial version