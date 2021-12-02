const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resume')
        .setDescription('Resume the song'),
    async execute(interaction) {
        queue = interaction.client.queues.get(interaction.channel.guild.id);
        if (!(queue === undefined) && queue.isAlive())
            queue.resume();
        return interaction.reply({ content: 'Ah shit, here we go again' });
    }
};