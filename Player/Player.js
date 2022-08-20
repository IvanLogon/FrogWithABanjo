const ytdl = require('ytdl-core');
const ytpl = require('ytpl');
const {
    AudioPlayerStatus,
    StreamType,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    VoiceConnectionStatus,
} = require('@discordjs/voice');
const Queue = require('./Queue');

module.exports = class Player {
    constructor() {
        this.queue = new Queue(100);
        this.observers = [];
        this.connection = null;
        this.player = null;
    }

    #play(url) {
        let stream = ytdl(url, { quality: 'lowestaudio', dlChunkSize: 6 * 1024 * 1024 });
        let resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
        this.player.play(resource);
    }

    // TODO mover al comando
    async addPlayListToQueue(url) {
        ytpl(url, { pages: 1 }).then(res => {
            for (let item of res.items) {
                this.queue.enqueue(item.url);
            }
        });
    }

    addSongToQueue(url) {
        this.queue.enqueue(url);
    }

    // Observer
    addObserver(element) {
        this.observers.push(element);
    }

    notify(state) {
        this.observers.forEach(observer => {
            observer.update(state);
        });
    }

    // State
    start(interaction) {
        this.player = createAudioPlayer();
        this.player.on(AudioPlayerStatus.Idle, () => this.next());
        this.player.on('error', (error) => {
            console.error(`Error: ${error.message}`);
            this.next();
        });

        this.connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        this.connection.on(VoiceConnectionStatus.Disconnected, () => this.quit());
        this.connection.subscribe(this.player);

        this.next();
    }

    quit() {
        // UIs
        this.notify({ isQuit: true });
        this.observers = null;
        // Player
        this.player.stop();
        this.connection.destroy();
        this.player = null;
        this.connection = null;
        // Queue
        this.queue = null;
    }

    move(interaction) {
        let channel = interaction.member.voice.channel;
        if (!channel) {
            return interaction.reply({ content: 'You need to be in a voice channel' });
        }
        // Check if bot has permissions.
        let permissions = channel.permissionsFor(interaction.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return interaction.reply({ content: 'I need the permissions to join your voice channel!' });
        }

        this.connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        this.notify({})
    }

    prev() {
        let url = this.queue.prequeue();
        this.#play(url);
        ytdl.getBasicInfo(url, {}).then(res =>
            this.notify({
                isFirst: this.queue.first(),
                isStopped: false,
                song: { title: res.player_response.videoDetails.title, url: url }
            })
        );
    }

    resume() {
        this.player.unpause();
        this.notify({ isStopped: false });
    }

    pause() {
        this.player.pause();
        this.notify({ isStopped: true });
    }

    next() {
        let url = this.queue.dequeue();
        if (url === undefined) {
            this.quit();
        } else {
            this.#play(url);
            ytdl.getBasicInfo(url, {}).then(res => this.notify({
                isFirst: this.queue.first(),
                isStopped: false,
                song: { title: res.player_response.videoDetails.title, url: url }
            }));
        }
    }

    isAlive() {
        return !(this.connection === null);
    }
}