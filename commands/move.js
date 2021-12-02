const { SlashCommandBuilder } = require('@discordjs/builders');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('move')
        .setDescription('Move the bot to another voice channel'),
    async execute(interaction) {
        // Check if user is in a voice channel
        let channel = interaction.member.voice.channel;
        if (!channel)
            return interaction.reply({ content: 'You need to be in a voice channel to move the bot!' });

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

        // Move
        queues = interaction.client.queues;
        if (queues.has(interaction.channel.guild.id))
            queues.get(interaction.channel.guild.id).move(connection);
        return interaction.reply({ content: 'Jumping to other channel.' });
    }
};