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
let gameState, currentGameFileFullPath;

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
                    if (files.length !== 0) {
                        setGameStateByFileFullPath(files[0]);
                    };
                });

            /* general */
            $('.goToGamePage').click(function () {
                renderGamePage();
            });

            function setGameStateByFileFullPath(fullPath) {
                fs.read(fullPath)
                    .then((state) => {
                        gameState = JSON.parse(state);
                        currentGameFileFullPath = fullPath;
                        renderScorePage();
                        window.location.hash = "#scorePage";
                    });
            };

            function renderScorePage() {
                $('#scorePageRoot').html(JSON.stringify(gameState.players));
            };
            /* /general */

            /* Home Page */
            $('#gameHistoryBtn').click(function () {
                return fs.list(logDir, 'e')
                    .then((files) => {
                        let $list = $('#gameHistoryList');
                        $list.html('');
                        for (let i = 0; i < files.length; i++) {
                            let file = files[i];
                            $list.append(`<li data-fullPath="${file.fullPath}">
                            <a href="#" class="gameHistoryListItem">
                            ${file.name.replace('T', ' ').split('.')[0]}
                            </a>
                            <a href="#" class="gameHistoryListItemDelete">Delete</a>
                            </li>`);
                        };
                        $list.listview('refresh');
                        $list.on('click', '.gameHistoryListItem', setGameStateByDataFullPath);
                        $list.on('click', '.gameHistoryListItemDelete', deleteGameHistoryListItem);
                    });
            });
            /* /Home Page */

            /* Game Page */
            $('.removeCurrentGame').click(function () {
                if (gameState && gameState.rounds.length !== 0 && gameState.rounds[gameState.rounds.length - 1].active) {
                    gameState.rounds.pop();
                    renderGamePage();
                };
            });
            $('.nextGameChoice').click(function () {
                let mode = $(this).attr('data-mode');
                gameState.rounds.push({ mode: mode, active: true, score: {} })
                renderGamePage();
                writeGameFile();
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
                    $(`#gamePageCurrentGameDiv .currentMode[data-gameMode="${currentRound.mode}"]`).removeClass('ui-screen-hidden');

                    // The Inferno Tower
                    if (currentRound.mode === 'tower') {
                        for (let playerIndex = 0; playerIndex < settings.game.players.max; playerIndex++) {
                            let $playerScoreContainer = $(`#gamePageCurrentGameDiv .currentMode[data-gameMode="tower"] .playerScoreContainer[data-index=${playerIndex}]`);
                            if (playerIndex < gameState.players.length) {
                                $playerScoreContainer.find('.playerName').first().text(gameState.players[playerIndex].name);
                                $playerScoreContainer.find('.towerScore').first().val(0);
                                $playerScoreContainer.removeClass('ui-screen-hidden');
                            }
                            else {
                                $playerScoreContainer.addClass('ui-screen-hidden');
                            };
                        };
                    }
                }
            };

            // tower
            $('#submitTowerScoreInput').click(function () {
                let maxScore = 0;
                let currentRound = gameState.rounds[gameState.rounds.length - 1];
                $(`#gamePageCurrentGameDiv .currentMode[data-gameMode="tower"] .playerScoreContainer`).not('.ui-screen-hidden').each(function (index, element) {
                    let score = parseInt($(element).find('.towerScore').first().val());
                    if (score > maxScore) { maxScore = score };
                    currentRound.score[index] = score;
                });
                for (let playerIndex in currentRound.score) {
                    if (currentRound.score[playerIndex] === maxScore) {
                        currentRound.score[playerIndex] += 5;
                    };
                    gameState.players[playerIndex].score += currentRound.score[playerIndex];
                };
                currentRound.active = false;
                renderScorePage();
                writeGameFile();
            });

        });
        /* /Game Page */

        /* New Game Page */
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
                    currentGameFileFullPath = file.fullPath;
                    return writeGameFile();
                })
        });
        /* /New Game Page */

        /* Game History Page */
        function deleteGameHistoryListItem() {
            let fullPath = $(this).parent().attr('data-fullPath');
            fs.remove(fullPath);
            $(this).parent().remove();
        };

        function setGameStateByDataFullPath(event, ui) {
            let fullPath = $(this).parent().attr('data-fullPath');
            setGameStateByFileFullPath(fullPath);
        };

        $('#newGamePage #deletePlayer').click(function () {
            let $deletePlayerBtn = $(this);
            $('.playerNameInputWrapper').not('.ui-screen-hidden').last().addClass('ui-screen-hidden');
            let currentPlayers = $('.playerNameInputWrapper').not('.ui-screen-hidden').length;
            if (currentPlayers === settings.game.players.min) {
                $deletePlayerBtn.addClass('ui-state-disabled');
            };
            $('#newGamePage #addPlayer').removeClass('ui-state-disabled');
        });
        /* /Game History Page */
    },

    // Update DOM on a Received Event
    receivedEvent: function (id) {
        console.log('Received Event: ' + id);
    }
};

function getDateString(date = new Date()) {
    return date.toISOString();
};

function writeGameFile(gameFullPath = currentGameFileFullPath, state = gameState) {
    return fs.write(gameFullPath, JSON.stringify(state));
};

app.initialize();