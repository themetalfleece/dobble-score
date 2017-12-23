/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

const CordovaPromiseFS = require('cordova-promise-fs');
const settings = require('../../settings');

const logDir = settings.logging.directory;

let fs = CordovaPromiseFS({
    persistent: true, // or false
    storageSize: 2 * 1024 * 1024, // storage size in bytes (=2MB)
    concurrency: 3, // how many concurrent uploads/downloads?
    Promise: require('bluebird') // Your favorite Promise/A+ library!
});
let gameState, currentGameFile;

var app = {
    // Application Constructor
    initialize: function () {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler. Bind any cordova events here. Common events are: 'pause', 'resume', etc.
    onDeviceReady: function () {
        this.receivedEvent('deviceready');

        $(document).ready(function () {

            // ensure the logging directory
            fs.ensure(logDir)
                .then(() => {
                    return fs.list(logDir)
                })
                .then((files) => {
                    console.log(files)
                })

            $('#newGamePage #deletePlayer').click(function () {
                let $deletePlayerBtn = $(this);
                $('.playerNameInputWrapper').not('.ui-screen-hidden').last().addClass('ui-screen-hidden');
                let currentPlayers = $('.playerNameInputWrapper').not('.ui-screen-hidden').length;
                if (currentPlayers === settings.game.players.min) {
                    $deletePlayerBtn.addClass('ui-state-disabled');
                };
                $('#newGamePage #addPlayer').removeClass('ui-state-disabled');
            });

            $('#newGamePage #addPlayer').click(function () {
                let $addPlayerBtn = $(this);
                $('.playerNameInputWrapper.ui-screen-hidden').first().removeClass('ui-screen-hidden');
                let currentPlayers = $('.playerNameInputWrapper').not('.ui-screen-hidden').length;
                if (currentPlayers === settings.game.players.max) {
                    $addPlayerBtn.addClass('ui-state-disabled');
                };
                $('#newGamePage #deletePlayer').removeClass('ui-state-disabled');
            });

            $('#newGamePage #startGame').click(function () {
                gameState = {
                    players: [],
                    rounds: []
                };
                $('#newGamePage .playerNameInputWrapper').each((index, element) => {
                    let $wrapper = $(element);
                    if (!$wrapper.hasClass('ui-screen-hidden')) {
                        let playerName = $wrapper.find('.playerNameInput').first().val();
                        gameState.players.push({ name: playerName, score: 0 });
                    };
                });

                renderGamePage();

                // create the file and write to it
                fs.create(`${logDir}${getDateString()}`)
                    .then((file) => {
                        currentGameFile = file;
                        return writeGameFile();
                    })
            });

            function renderGamePage() {
                if (gameState.rounds.length === 0 || !gameState.rounds[gameState.rounds.length - 1].active) {
                    $('#gamePageChooseNextDiv').removeClass('ui-screen-hidden');
                    $('#gamePageCurrentGameDiv').addClass('ui-screen-hidden');
                }
                else {
                    let currentRound = gameState.rounds[gameState.rounds.length - 1];
                    $('#gamePageChooseNextDiv').addClass('ui-screen-hidden');
                    $('#gamePageCurrentGameDiv').removeClass('ui-screen-hidden');

                    $('#gamePageCurrentGameName').text(settings.game.modes[currentRound.mode]);
                }
            };

            $('.nextGameChoice').click(function () {
                let gameMode = $(this).attr('data-gameMode');
                gameState.rounds.push({ mode: gameMode, active: true, score: {} })
                renderGamePage();
                writeGameFile();
            });

        });

    },

    // Update DOM on a Received Event
    receivedEvent: function (id) {
        console.log('Received Event: ' + id);
    }
};

function getDateString(date = new Date()) {
    return date.toISOString();
};

function writeGameFile(gameFile = currentGameFile, state = gameState) {
    return fs.write(gameFile.fullPath, JSON.stringify(state));
};

app.initialize();