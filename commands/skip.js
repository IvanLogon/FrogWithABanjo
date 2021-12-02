const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip current song.'),
    async execute(interaction) {
        queue = interaction.client.queues.get(interaction.channel.guild.id);
        if (!(queue === undefined) && queue.isAlive())
            queue.skip();
        return interaction.reply({ content: 'Ok...' });
    }
};