'use strict';

// 初期化
const PicoAudio = require('picoaudio');
const picoAudio = new PicoAudio();
picoAudio.init();
// ループ再生設定
picoAudio.setLoop(true);

// コアシステムが曲を止めたら自分も止める
const _stopBgm = AudioManager.stopBgm;
AudioManager.stopBgm = function() {
    _stopBgm.call(this);

    picoAudio.pause();
};

// マスターボリューム反映
const _setBGMVolume = AudioManager.updateBgmParameters;
AudioManager.updateBgmParameters = function(value) {
    _setBGMVolume.call(this, value);

    picoAudio.setMasterVolume(AudioManager.bgmVolume / 100);
};

// コマンドー
const _pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function(command, args) {
    const ret = _pluginCommand.apply(command, args);

    if (command == 'ATS_Midi') {
        switch (args[0]) {
            case 'play':
                play(args[1]);
                break;

            case 'pause':
            case 'stop':
                pause();
                break;

            case "resume":
                resume();
        }
    }

    return ret;
};

function play(filePath) {
    // コアシステムの曲の再生を止める
    AudioManager.stopBgm();

    const url = 'audio/bgm/' + encodeURIComponent(filePath);

    // load
    const request = new XMLHttpRequest();
    request.open('GET', url);
    request.responseType = 'arraybuffer';
    request.onreadystatechange = function() {
        if (request.readyState == 4 &&
            (request.status == 200 || request.status == 304)) {
            const smfData = new Uint8Array(request.response);
            const parsedData = picoAudio.parseSMF(smfData);

            // SMFデータを読み込んで再生
            picoAudio.setData(parsedData);
            picoAudio.play();
        }
    }.bind(this);
    request.send(null);
}

// 停止・一時停止
function pause() {
    picoAudio.pause();
}

// レジューム
function resume() {
    picoAudio.play();
}
