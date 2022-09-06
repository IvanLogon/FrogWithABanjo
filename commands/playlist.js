const { SlashCommandBuilder } = require('@discordjs/builders');
const ytdl = require('ytdl-core');
const ytpl = require('ytpl');

const Player = require('../Player/Player');
const UI = require('../Player/UI');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Play a playlist.')
        .addStringOption(option => option
            .setName('url')
            .setDescription("link of the playlist (Youtube mixes doesn't work)")
            .setRequired(true)),
    async execute(interaction) {
        // Check command syntax
        let url = interaction.options.getString('url').trim();
        if (!ytdl.validateURL(url))
            return interaction.reply({ content: 'Sorry this playlist link is invalid.' });

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
        const getPlaylist = (player, input) => {
            return ytpl(input, { pages: 1 }).then(res => {
                for (let item of res.items) {
                    player.addSongToQueue(item.url);
                }
            });
        };
        const players = interaction.client.players;
        let player = players.get(interaction.channel.guild.id);
        if (player?.isAlive()) {
            try {
                return getPlaylist(player, url)
                    .then(() => interaction.reply({ content: "Playlist added", fetchReply: true }))
                    .then((msg) => setTimeout(() => msg.delete(), 10000));
            } catch (err) {
                return interaction.reply("Error :/");
            }
        } else {
            try {
                player = new Player();
                new UI(player, interaction);
                players.set(interaction.channel.guild.id, player);
                return getPlaylist(player, url)
                    .then(() => interaction.reply("Joining channel"))
                    .then(() => player.start(interaction));
            } catch (err) {
                return interaction.reply("Error :/");
            }
        }
    }
};