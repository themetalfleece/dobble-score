npm i
npm i -g browserify cordova
browserify www/js/index.raw.js > www/js/index.js; cordova build browser; cordova run browser