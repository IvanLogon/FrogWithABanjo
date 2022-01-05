'use strict';
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
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
        this.urls = [];
    }

    #dequeue() {
        return this.urls.shift();
    }

    #enqueue(url) {
        this.urls.push(url);
    }

    #play(url) {
        let stream = ytdl(url, { quality: 'lowestaudio', dlChunkSize: 6 * 1024 * 1024 });
        let resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
        this.player.play(resource);
    }

    async enqueuePlaylist(url) {
        // Resolves playlist
        ytpl(url, { pages: 1 }).then(res => {
            for (let item of res.items) {
                this.#enqueue(item.url)
            }
        });
    }

    enqueueSong(url) {
        this.#enqueue(url);
    }

    start(connection) {
        if (!(this.connection === null) && this.connection.joinConfig.channelId === connection.joinConfig.channelId) {
            return;
        }
        // Guild player inicialization
        this.connection = connection;
        this.player = createAudioPlayer();
        this.connection.subscribe(this.player);
        this.player.on(AudioPlayerStatus.Idle, () => this.skip());
        let url = this.#dequeue();
        this.#play(url);

    }

    skip() {
        let url = this.#dequeue();
        if (url === undefined) {
            this.stop();
        } else {
            this.#play(url);
        }
    }

    move(connection) {
        if (this.isAlive()) {
            this.connection = connection;
        }
    }

    pause() {
        this.player.pause();
    }

    stop() {
        this.urls = [];
        this.player.stop();
        this.connection.destroy();
        this.player = null;
        this.connection = null;
    }

    resume() {
        this.player.unpause();
    }

    isAlive() {
        return !(this.connection === null);
    }
}