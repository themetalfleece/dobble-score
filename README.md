# About this project
This is a score keeper for the board game "Dobble", where the score is easily calculated by a simple user input.

It supports all game modes and 2-8 players.
Also, every game is saved so it can be loaded at anytime.

It's also **[published on Play Store](https://play.google.com/store/apps/details?id=com.themetalfleece.dobbler_score)**

# Installation
* install [npm](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/en/docs/install)
* `yarn global add cordova browserify`
* cd to project path
* `cordova platform add android` and/or `cordova platform add browser`
* `cordova plugin add cordova-plugin-file`
* `cordova plugin add cordova-plugin-exclude-files`
* or `cordova prepare`
* `yarn`

# Running the app
Android:
* `browserify www/js/index.js > www/js/app-index.js; cordova build android; cordova run android`

Browser:
* `browserify www/js/index.js > www/js/app-index.js; cordova build browser; cordova run browser`
