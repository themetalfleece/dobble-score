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
* `browserify www/js/index.raw.js > www/js/index.js; cordova build android; cordova run android`

Browser:
* `browserify www/js/index.raw.js > www/js/index.js; cordova build browser; cordova run browser`