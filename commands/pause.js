const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause the song'),
    async execute(interaction) {
        queue = interaction.client.queues.get(interaction.channel.guild.id);
        if (!(queue === undefined) && queue.isAlive())
            queue.pause();
        return interaction.reply({ content: 'I\'m going to get tobacco.' });
    }
};