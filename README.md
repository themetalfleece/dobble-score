# Installation
* install npm
* `npm i -g cordova browserify`
* cd to project path
* `cordova platform add android` and/or `cordova platform add browser`
* `cordova plugin add cordova-plugin-file`
* `cordova plugin add cordova-plugin-exclude-files`
* or `cordova prepare`
* `npm i`
# Running the app
Android:
* `browserify www/js/index.raw.js > www/js/index.js; cordova build android; cordova run android`

Browser:
* `browserify www/js/index.raw.js > www/js/index.js; cordova build browser; cordova run browser`