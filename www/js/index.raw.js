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

let gameState;
let fs = CordovaPromiseFS({
    persistent: true, // or false
    storageSize: 2 * 1024 * 1024, // storage size in bytes (=2MB)
    concurrency: 3, // how many concurrent uploads/downloads?
    Promise: require('bluebird') // Your favorite Promise/A+ library!
});

var app = {
    // Application Constructor
    initialize: function () {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function () {
        this.receivedEvent('deviceready');

        $(document).ready(function () {

            $('#newGamePage #startGame').click(function () {
                gameState = { players: [] };
                $('#newGamePage .playerNameInputWrapper').each((index, element) => {
                    let $wrapper = $(element);
                    if (!$wrapper.hasClass('ui-screen-hidden')) {
                        let playerName = $wrapper.find('.playerNameInput').first().val();
                        gameState.players.push({ name: playerName });
                    };
                });
                console.log(gameState);
            });

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
        });

    },

    // Update DOM on a Received Event
    receivedEvent: function (id) {
        console.log('Received Event: ' + id);
    }
};

app.initialize();