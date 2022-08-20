const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel } = require('@discordjs/voice');
const Player = require('../Player/Player');
const ytdl = require('ytdl-core');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Play a playlist.')
        .addStringOption(option => option.setName('url').setDescription('link of the video').setRequired(true)),
    async execute(interaction) {
        // Check command syntax
        let url = interaction.options.getString('url').trim();
        if (!ytdl.validateURL(url))
            return interaction.reply({ content: 'Sorry bro, url ins\'t valid.' });
        // Check if user is in a voice channel
        let channel = interaction.member.voice.channel;
        if (!channel)
            return interaction.reply({ content: 'You need to be in a voice channel to play music!' });

        // Check if bot has permissions.
        let permissions = channel.permissionsFor(interaction.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK'))
            return interaction.reply({ content: 'I need the permissions to join your voice channel!' });

        // Create the connection
        let connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.channel.guild.id,
            adapterCreator: interaction.channel.guild.voiceAdapterCreator,
        });

        // Play audio
        let queues = interaction.client.players;
        if (!queues.has(interaction.channel.guild.id)) {
            queues.set(interaction.channel.guild.id, new Player());
        }
        let queue = queues.get(interaction.channel.guild.id);
        await queue.addPlaylistToQueue(url);
        queue.start(connection);

        return interaction.reply({ content: `Next rolita ${url}.` });
    }
};