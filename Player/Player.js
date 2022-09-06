const ytdl = require('ytdl-core');
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

    addSongToQueue(url) {
        this.queue.enqueue(url);
    }

    // Observer
    addObserver(element) {
        this.observers.push(element);
    }

    async #notifyObservers(state) {
        for (let observer of this.observers) {
            await observer.update(state);
        }
    }

    async #disposeObservers() {
        for (let observer of this.observers) {
            await observer.dispose();
        }
    }

    // State
    #sameChannel(interaction) {
        if (interaction === undefined) return true;

        return interaction.member.voice.channel.id == this.connection.joinConfig.channelId;
    }

    async start(interaction) {
        this.player = createAudioPlayer();
        this.player.on(AudioPlayerStatus.Idle, async () => await this.next());
        this.player.on('error', async (error) => {
            console.error(`Error: ${error.message}`);
            await this.next();
        });

        this.connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });
        this.connection.subscribe(this.player);

        await this.next(interaction);
    }

    async quit(interaction) {
        if (!this.#sameChannel(interaction))
            return await interaction.reply({ content: 'You need to be in the same voice channel' });
        // UIs
        await this.#disposeObservers();
        this.observers = [];
        // Player
        this.player.stop();
        this.connection.destroy();
        this.player = null;
        this.connection = null;
        // Queue
        this.queue = null;
    }

    async move(interaction) {
        // Check if user is in a voice channel
        let channel = interaction.member.voice.channel;
        if (!channel) {
            return await interaction.reply({ content: 'You need to be in a voice channel' });
        }

        // Check same channel
        if (this.#sameChannel(interaction))
            return await interaction.reply({ content: 'You need to be in a different voice channel' });

        // Check if bot has permissions.
        let permissions = channel.permissionsFor(interaction.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK'))
            return await interaction.reply({ content: 'I need the permissions to join your voice channel!' });

        // Change connection
        this.connection = joinVoiceChannel({
            channelId: interaction.member.voice.channel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        await this.#notifyObservers({})
    }

    async prev(interaction) {
        if (!this.#sameChannel(interaction))
            return await interaction.reply({ content: 'You need to be in the same voice channel' });

        let url = this.queue.prequeue();
        this.#play(url);
        const response = await ytdl.getBasicInfo(url, {});
        await this.#notifyObservers({
            isFirst: this.queue.first(),
            isStopped: false,
            song: {
                title: response.player_response.videoDetails.title,
                thumbnail: response.videoDetails.thumbnails[0].url,
                url: url
            }
        });
    }

    async resume(interaction) {
        if (!this.#sameChannel(interaction))
            return await interaction.reply({ content: 'You need to be in the same voice channel' });

        this.player.unpause();
        await this.#notifyObservers({ isStopped: false });
    }

    async pause(interaction) {
        if (!this.#sameChannel(interaction))
            await interaction.reply({ content: 'You need to be in the same voice channel' });

        this.player.pause();
        await this.#notifyObservers({ isStopped: true });
    }

    async next(interaction) {
        if (!this.#sameChannel(interaction))
            return await interaction.reply({ content: 'You need to be in the same voice channel' });

        let url = this.queue.dequeue();
        if (url === undefined)
            return await this.quit(interaction);

        this.#play(url);
        const response = await ytdl.getBasicInfo(url, {});
        await this.#notifyObservers({
            isFirst: this.queue.first(),
            isStopped: false,
            song: {
                title: response.player_response.videoDetails.title,
                thumbnail: response.videoDetails.thumbnails[0].url,
                url: url
            }
        });
    }

    isAlive() {
        return !(this.connection === null || this.connection === undefined || this.player === null || this.player === undefined);
    }

    async dispose() {
        await this.#disposeObservers();
        if (this.player != null) {
            this.player.stop();
            this.connection.destroy();
        }
    }
}