const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Exits the voice channel and empties the queue'),
    async execute(interaction) {
        queue = interaction.client.queues.get(interaction.channel.guild.id);
        if (!(queue === undefined) && queue.isAlive())
            queue.stop();
        return interaction.reply({ content: 'I\'m quitting!' });
    }
};