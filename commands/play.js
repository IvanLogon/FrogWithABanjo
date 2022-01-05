const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel } = require('@discordjs/voice');
const Queue = require('../queue');
const ytdl = require('ytdl-core');
const ytsr = require('ytsr');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song.')
        .addStringOption(option => option.setName('input').setDescription('name or link of the video').setRequired(true)),
    async execute(interaction) {
        // Process input
        let input = interaction.options.getString('input').trim();
        if (!ytdl.validateURL(input)) {
            const search = await ytsr(input, { limit: 1 });
            input = search.items[0].url;
        }

        // Check if user is in a voice channel
        let channel = interaction.member.voice.channel;
        if (!channel) {
            return interaction.reply({ content: 'You need to be in a voice channel to play music!' });
        }

        // Check if bot has permissions.
        let permissions = channel.permissionsFor(interaction.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return interaction.reply({ content: 'I need the permissions to join your voice channel!' });
        }

        // Create the connection
        let connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.channel.guild.id,
            adapterCreator: interaction.channel.guild.voiceAdapterCreator,
        });

        // Play audio
        let queues = interaction.client.queues;
        if (!queues.has(interaction.channel.guild.id)) {
            queues.set(interaction.channel.guild.id, new Queue());
        }
        let queue = queues.get(interaction.channel.guild.id);
        queue.enqueueSong(input);
        queue.start(connection);

        return interaction.reply({ content: `Next rolita ${input}.` });
    }
};