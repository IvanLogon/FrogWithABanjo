const { SlashCommandBuilder } = require('@discordjs/builders');
const { validateURL } = require('ytdl-core');
const ytsr = require('ytsr');

const Player = require('../Player/Player');
const UI = require('../Player/UI');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song.')
        .addStringOption(option => option
            .setName('input')
            .setDescription('name or link of the video')
            .setRequired(true)),
    async execute(interaction) {
        // Process input
        let input = interaction.options.getString('input').trim();
        if (!validateURL(input)) {
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

        // Play audio
        let players = interaction.client.players;
        let player = players.get(interaction.channel.guild.id);
        if (player?.isAlive()) {
            player.addSongToQueue(input);
            return interaction.reply({ content: "Song added",  fetchReply: true }).then(msg => setTimeout(() => msg.delete(), 10000));
        } else {
            player = new Player();
            new UI(player, interaction);
            players.set(interaction.channel.guild.id, player);
            player.addSongToQueue(input);
            return interaction.reply("Joining channel").then( () =>  player.start(interaction));
        }
    }
};