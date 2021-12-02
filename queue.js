'use strict';
const ytdl = require('ytdl-core');
const {
    AudioPlayerStatus,
    StreamType,
    createAudioPlayer,
    createAudioResource,
} = require('@discordjs/voice');

module.exports = class Queue {
    constructor() {
        this.connection = null;
        this.player = null;
        this.songs = [];
    }

    #dequeue() {
        return this.songs.shift()
    }

    #enqueue(song) {
        this.songs.push(song)
    }

    #play(song) {
        let stream = ytdl(song, { filter: 'audioonly' });
        let resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
        this.player.play(resource);
    }

    play(song, connection) {
        if (!(this.connection === null) && this.connection.joinConfig.channelId === connection.joinConfig.channelId) {
            this.#enqueue(song)
        }
        else {
            if (this.connection === null)
                this.connection = connection;
            this.player = createAudioPlayer();
            this.connection.subscribe(this.player);
            this.player.on(AudioPlayerStatus.Idle, () => this.skip());
            this.#play(song);
        }
    }

    move(connection) {
        if (this.isAlive()) {
            this.connection = connection;
        }
    }

    skip() {
        let song = this.#dequeue();
        if (song === undefined) {
            this.stop();
        } else {
            this.#play(song);
        }
    }

    pause() {
        this.player.pause();
    }

    resume() {
        this.player.unpause();
    }

    stop() {
        this.songs = [];
        this.player.stop();
        this.connection.destroy();
        this.player = null;
        this.connection = null;
    }

    isAlive() {
        return !(this.connection === null);
    }
}