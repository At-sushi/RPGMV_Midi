'use strict';

// 初期化
const picoAudio = require('picoaudio');
picoAudio.init();

// コアシステムが曲を止めたら自分も止める
const _stopBgm = AudioManager.stopBgm;
AudioManager.stopBgm = function() {
    _stopBgm.call(this);

    picoAudio.pause();
};

// コマンドー
const _pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    _pluginCommand.call(this);

    if (command == 'MV_Midi') {
        switch (args[0]) {
            case 'play':
                play(args[1]);
                break;

            case 'pause':
                pause();
        }
    }
};

function play(filePath) {
    // コアシステムの曲の再生を止める
    AudioManager.stopBgm();

    const url = 'audio/bgm/' + encodeURIComponent(filePath);

    // load
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = 'arraybuffer';
    request.onload = function() {
        if (request.status == 200 || request.status == 304) {
            const smfData = request.response;
            const parsedData = picoAudio.parseSMF(smfData);

            // ループ再生する
            picoAudio.setData(parsedData);
            picoAudio.play(true);
        }
    }.bind(this);
    request.send();
}

function pause() {
    picoAudio.pause();
}