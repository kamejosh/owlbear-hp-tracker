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