'use strict';

/*:
 * @plugindesc MIDI Player
 * @author At-susbi
 * 
 * @help
 * ■プラグインコマンド一覧
 * 
 * ・ATS_Midi play ファイル名.mid
 * 　MIDIファイルをBGMとして再生します。
 * 　ファイルはbgmフォルダ以下に格納されている必要があります。
 * 
 * ・ATS_Midi pause
 * ・ATS_Midi stop
 * 　BGMの再生を停止します。現地点ではどちらのコマンドも同じです。
 * 
 * ・ATS_Midi resume
 * 　停止中のBGMを前回の再生位置から再開します。
 */

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

    picoAudio.setMasterVolume(AudioManager.masterVolume * (AudioManager.bgmVolume / 100));
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
