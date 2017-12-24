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
            function renderScorePage() {
                let $list = $('#scorePageList');
                $list.html('');
                let orderedPlayers = Array.from(gameState.players);
                orderedPlayers.sort(function (a, b) { return a.score < b.score });
                for (let i = 0; i < orderedPlayers.length; i++) {
                    let player = orderedPlayers[i];
                    $list.append(`<li>
                    ${player.name}
                    <span class="ui-li-count">${player.score}
                    </span></li>`);
                };
                $list.listview().listview('refresh');
            };

            $('.goToScorePage').click(function () {
                renderScorePage();
            });

            $('.goToGamePage').click(function () {
                renderGamePage();
            });

            function setGameStateByFileFullPath(fullPath) {
                fs.read(fullPath)
                    .then((state) => {
                        gameState = JSON.parse(state);
                        currentGameFileFullPath = fullPath;
                        setCurrentGameFooter();
                        renderScorePage();
                        window.location.hash = "#scorePage";
                    });
            };

            function setCurrentGameFooter() {
                $('.currentGameFooter').text(`Current Game: ${prettifyFileName(currentGameFileFullPath)}`);
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
                            ${prettifyFileName(file.name)}
                            </a>
                            <a href="#" class="gameHistoryListItemDelete">Delete</a>
                            </li>`);
                        };
                        $list.listview().listview('refresh');
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
                $('.nextGameChoice').removeClass('ui-btn-b');
                if (gameState.rounds.length === 0 || !gameState.rounds[gameState.rounds.length - 1].active) {
                    $('#gamePageChooseNextDiv').removeClass('ui-screen-hidden');
                    $('#gamePageCurrentGameDiv').addClass('ui-screen-hidden');
                }
                else {
                    let currentRound = gameState.rounds[gameState.rounds.length - 1];
                    $('#gamePageChooseNextDiv').addClass('ui-screen-hidden');
                    $('#gamePageCurrentGameDiv').removeClass('ui-screen-hidden');

                    $('#gamePageCurrentGameName').text(settings.game.modes[currentRound.mode]);

                    hideNonCurrentModes(currentRound.mode);

                    // handler for each game mode
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
                    else if (currentRound.mode === 'well') {
                        let $selectFirst = $('#towerFirstPlayerInput'), $selectLast = $('#towerLastPlayerInput');
                        $selectFirst.html('');
                        $selectLast.html('');
                        for (let playerIndex = 0; playerIndex < gameState.players.length; playerIndex++) {
                            let player = gameState.players[playerIndex];
                            $selectFirst.append(`<option value=${playerIndex}>${player.name}</option>`);
                            $selectLast.append(`<option value=${playerIndex}>${player.name}</option>`);
                        };
                        $selectFirst.selectmenu().selectmenu('refresh');
                        $selectLast.selectmenu().selectmenu('refresh');
                    }
                }
            };

            function hideNonCurrentModes(mode) {
                $(`#gamePageCurrentGameDiv .currentMode`).not(`[data-gameMode="${mode}"]`).addClass('ui-screen-hidden');
                $(`#gamePageCurrentGameDiv .currentMode[data-gameMode="${mode}"]`).removeClass('ui-screen-hidden');
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
                window.location.hash = "#scorePage";
                writeGameFile();
            });
            // well
            $('#submitWellScoreInput').click(function () {
                let firstPlayerIndex = parseInt($('#towerFirstPlayerInput option:selected').val());
                let lastPlayerIndex = parseInt($('#towerLastPlayerInput option:selected').val());
                if (firstPlayerIndex === lastPlayerIndex) {
                    alert('The first and last players cannot be the same');
                    return;
                };
                let currentRound = gameState.rounds[gameState.rounds.length - 1];

                for (let playerIndex = 0; playerIndex < gameState.players.length; playerIndex++) {
                    if (playerIndex === firstPlayerIndex) {
                        currentRound.score[playerIndex] = 10;
                    }
                    else if (playerIndex === lastPlayerIndex) {
                        currentRound.score[playerIndex] = -20;
                    }
                    else {
                        currentRound.score[playerIndex] = 0;
                    };

                    gameState.players[playerIndex].score += currentRound.score[playerIndex];
                };

                currentRound.active = false;
                renderScorePage();
                window.location.hash = "#scorePage";
                writeGameFile();
            });

            // suggest random button
            $('#randomGameSuggest').click(function () {
                $('.nextGameChoice').removeClass('ui-btn-b');
                $('.nextGameChoice').eq(Math.floor(Math.random() * (5))).addClass('ui-btn-b');
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
                let fileName = `${getDateString()}.${gameState.players.length}`;
                fs.create(`${logDir}${fileName}`)
                    .then((file) => {
                        currentGameFileFullPath = file.fullPath;
                        setCurrentGameFooter();
                        return writeGameFile();
                    })
            });
            /* /New Game Page */

            /* Game History Page */
            $('#gameHistoryList').on('click', '.gameHistoryListItem', setGameStateByDataFullPath);
            $('#gameHistoryList').on('click', '.gameHistoryListItemDelete', deleteGameHistoryListItem);

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

        });
    },

    // Update DOM on a Received Event
    receivedEvent: function (id) {
        console.log('Received Event: ' + id);
    }
};

function getDateString(date = new Date()) {
    return date.toISOString().replace(/:/g, 'U');
};

function writeGameFile(gameFullPath = currentGameFileFullPath, state = gameState) {
    return fs.write(gameFullPath, JSON.stringify(state));
};

function prettifyFileName(name) {
    let prettyName = `${name.split('.')[0].replace('T', ' ').replace(/U/g, ':')} - ${name.split('.')[2]} Players`;
    if (prettyName.lastIndexOf('/') !== -1) {
        prettyName = prettyName.substring(prettyName.lastIndexOf('/') + 1);
    };
    return prettyName;
};

app.initialize();