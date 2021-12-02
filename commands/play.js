const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel } = require('@discordjs/voice');
const Queue = require('../queue');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song.')
        .addStringOption(option => option.setName('url').setDescription('link of the video').setRequired(true)),
    async execute(interaction) {
        // Check command syntax
        let url = interaction.options.getString('url').trim();
        if (url.length > 2048)
            return interaction.reply({ content: 'How long you have it, the url of course!' });
        if (!url.startsWith('https://www.youtube.com/watch?'))
            return interaction.reply({ content: 'Sorry bro, url is not valid.' });
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
        queues = interaction.client.queues;
        if (!queues.has(interaction.channel.guild.id))
            queues.set(interaction.channel.guild.id, new Queue());

        queues.get(interaction.channel.guild.id).play(url, connection);

        return interaction.reply({ content: `Next rolita ${url}.` });
    }
};