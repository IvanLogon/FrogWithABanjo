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

    #play() {
        let url = #dequeue();
        let stream = ytdl(url, { quality: 'highestaudio', dlChunkSize: 6 * 1024 * 1024 });
        let resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
        this.player.play(resource);
    }

    enqueuePlaylist(url) {
        // Resolves playlist
        ytpl(url, { pages: 1 }).then(res => {
            let short = url.slice(0, 43);
            for (let item of res.items) {
                if (!isEmpty || item.shorturl != short) {
                    this.#enqueue(item.url)
                }
            }
        });
    }

    enqueueSong(url) {
        // Comprobar si es url o 'texto plano'
        this.#enqueue(url);
    }

    playlist(url, connection) {
        if (!(this.connection === null) && this.connection.joinConfig.channelId === connection.joinConfig.channelId) {
            this.readPlaylist(url, false)
        } else {
            // Guild player inicialization
            this.connection = connection;
            this.player = createAudioPlayer();
            this.connection.subscribe(this.player);
            this.player.on(AudioPlayerStatus.Idle, () => this.skip());
            // Add url/playlist
            this.readPlaylist(url, true)
            this.#play(url);
        }
    }

    play(url, connection) {
        if (!(this.connection === null) && this.connection.joinConfig.channelId === connection.joinConfig.channelId) {
            // Enqueue url
            this.#enqueue(url);
        }
        else {
            // Guild player inicialization
            this.connection = connection;
            this.player = createAudioPlayer();
            this.connection.subscribe(this.player);
            this.player.on(AudioPlayerStatus.Idle, () => this.skip());
            // Add url
            this.#play(url);
        }
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
        this.#play();

    }

    move(connection) {
        if (this.isAlive()) {
            this.connection = connection;
        }
    }

    skip() {
        let url = this.#dequeue();
        if (url === undefined) {
            this.stop();
        } else {
            this.#play(url);
        }
    }

    pause() {
        this.player.pause();
    }

    resume() {
        this.player.unpause();
    }

    stop() {
        this.urls = [];
        this.player.stop();
        this.connection.destroy();
        this.player = null;
        this.connection = null;
    }

    isAlive() {
        return !(this.connection === null);
    }
}