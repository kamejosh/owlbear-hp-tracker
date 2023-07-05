# HP Tracker - Owlbear Plugin

This Repository contains an Extension for Owlbear Rodeo 2.0. This extension allows for tracking HP of characters and handling who can view this information.

![hp-tracker example](https://raw.githubusercontent.com/kamejosh/owlbear-hp-tracker/master/docs/HP_Tracker.png)

## Installing

The extension can be installed manually, by pasting the [manifest link](https://hp-tracker.onrender.com/manifest.json) in the Add Extension dialog.

## How it works

This project uses [React](https://reactjs.org/) for the UI. It contains three different parts:

+ Hp Tracker window
+ Hp Tracker popover
+ Hp Tracker background tasks

### Hp Tracker Window

This is a custom Action that can be opened on the top left to display all Characters HP and also change the current HP setting. Max HP must be changed in the [HP Tracker Popover](#hp-tracker-popover). Also when clicking on the name of a character the icon is tilted a little to make it easy to find on the map.

### Hp Tracker Popover

This is a custom Popover than can be accessed from the Item Contextmenu. Per default on a new Item the Name is set to the Item name. Besides name and hp settings three checkboxes allow for the following changes:

+ Active: Sets if the HP is tracked in the [Hp Tracker Window](#p-tracker-window)
+ Visible for Players: Sets if the Item is also displayed in the Hp Tracker Window when logged in with role "PLAYER"
+ Add to Map: Sets if the current HP and max HP are displayed on the map beneath the character token. Is per default displayed on the GM screen. If `Visible for Players` is also checked then players can also see these values.

### Hp Tracker background Tasks

Handle setting defaults and subscribing and handling HP changes so they are propagated properly across all Views.

## Next steps

The Extension is currently released as MVP. There is still a list of features that will be added in the coming weeks/months/years (suggestions welcome).

+ UI Improvements: It's not the prettiest yet but we'll get there
+ Add character state chaanges (prone, sleep, poison,...)
+ Death Save tracking
+ ...

## Building

Can be built with `make build`, for development use `make run`.

## License

MIT

## Contributing

I'm not sure how to handle contributions yet, Bug fixes are always welcome but features depend on backwards compatibility and maintaining a simple enough extension to use. But feel free to fork and open PRs.

Copyright (C) 2023 Joshua Hercher