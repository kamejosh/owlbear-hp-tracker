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