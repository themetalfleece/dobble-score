# About this project
This is a score keeper for the board game "Dobble", where the score is easily calculated by a simple user input.

It supports all game modes and 2-8 players.
Also, every game is saved so it can be loaded at anytime.

It's also **[published on Play Store](https://play.google.com/store/apps/details?id=com.themetalfleece.dobbler_score)**

# Installation
* install [npm](https://nodejs.org/en/) and [yarn](https://yarnpkg.com/en/docs/install)
* `yarn global add cordova browserify`
* cd to project path
* `yarn prepare`

# Running the app
Android:
* `yarn android`

Browser:
* `yarn browser`

# Build for Android
Install [Android Studio](https://developer.android.com/studio/)
* To build the unsigned version, run `yarn android-release`
* To build the signed version, run `yarn build-js && cordova run android --release -- --keystore=../my-release-key.keystore --storePassword=password --alias=alias_name --password=password`. More info [here](https://cordova.apache.org/docs/en/latest/guide/platforms/android/#signing-an-app)