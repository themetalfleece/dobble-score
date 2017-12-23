# Installation
* install npm
* `npm i -g cordova browserify`
* cd to project path
* `npm i`
* `cordova platform add browser`
# Running the app
* `browserify www/js/index.raw.js > www/js/index.js; cordova build browser; cordova run browser`