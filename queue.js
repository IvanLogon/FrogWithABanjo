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
        this.songs = [];
    }

    #dequeue() {
        return this.songs.shift();
    }

    #enqueue(song) {
        this.songs.push(song);
    }

    #play(song) {
        let stream = ytdl(song, { quality: 'highestaudio', dlChunkSize: 6 * 1024 * 1024 });
        let resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
        this.player.play(resource);
    }

    play(song, connection, isPlaylist) {
        if (!(this.connection === null) && this.connection.joinConfig.channelId === connection.joinConfig.channelId) {
            // Enqueue song/playlist
            if (isPlaylist) {
                this.readPlaylist(song, false)
            } else {
                this.#enqueue(song);
            }
        }
        else {
            // Guild player inicialization
            this.connection = connection;
            this.player = createAudioPlayer();
            this.connection.subscribe(this.player);
            this.player.on(AudioPlayerStatus.Idle, () => this.skip());
            // Add song/playlist
            if (isPlaylist) {
                this.readPlaylist(song, true)
            }
            this.#play(song);
        }
    }

    readPlaylist(url, isEmpty) {
        ytpl(url, { pages: 1 }).then(res => {
            let short = url.slice(0, 43);
            for (let item of res.items) {
                if (!isEmpty || item.shortUrl != short) {
                    this.#enqueue(item.url)
                }
            }
        });
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