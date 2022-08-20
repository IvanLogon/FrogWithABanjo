const { MessageActionRow, MessageButton, MessageEmbed } = require('discord.js');

module.exports = class UI {
    constructor(player, interaction) {
        // Buttons
        this.moveBtn = new MessageButton().setCustomId('Move').setLabel('Move').setStyle('SECONDARY');
        this.quitBtn = new MessageButton().setCustomId('Quit').setLabel('Quit').setStyle('DANGER');
        this.prevBtn = new MessageButton().setCustomId('Prev').setLabel('Prev').setStyle('PRIMARY');
        this.playBtn = new MessageButton().setCustomId('Play').setLabel('Play').setStyle('PRIMARY');
        this.stopBtn = new MessageButton().setCustomId('Stop').setLabel('Stop').setStyle('PRIMARY');
        this.nextBtn = new MessageButton().setCustomId('Next').setLabel('Next').setStyle('PRIMARY');

        // Layout
        this.layout = () => [
            new MessageActionRow()
                .addComponents(
                    this.moveBtn,
                    this.quitBtn,
                ),
            new MessageActionRow()
                .addComponents(
                    this.prevBtn,
                    this.playBtn,
                    this.stopBtn,
                    this.nextBtn,
                )
        ];

        // Events
        player.addObserver(this);
        this.interaction = interaction;
        this.collector = interaction.channel.createMessageComponentCollector();
        this.collector.on('collect', async interaction => {
            this.interaction = interaction;
            switch (interaction.customId) {
                case 'Move':
                    player.move(interaction);
                    break;
                case 'Quit':
                    player.quit();
                    break;
                case 'Prev':
                    player.prev();
                    break;
                case 'Play':
                    player.resume();
                    break;
                case 'Stop':
                    player.pause();
                    break;
                case 'Next':
                    player.next();
                    break;
            }
        });
    }

    #updatePrevBtn(isFirst) {
        if (isFirst === undefined) return;

        if (isFirst) {
            this.prevBtn.setDisabled(true);
        } else {
            this.prevBtn.setDisabled(false);
        }
    }

    #updatePlayAndPauseBtn(isStopped) {
        if (isStopped === undefined) return;

        if (isStopped) {
            this.playBtn.setDisabled(false);
            this.stopBtn.setDisabled(true);
        } else {
            this.playBtn.setDisabled(true);
            this.stopBtn.setDisabled(false);
        }
    }

    #updateEmbed(song) {
        let embed;
        if (song) {
            embed = new MessageEmbed()
                .setColor('#FF0000')
                .setTitle(song.title)
                .setURL(song.url);
        } else {
            embed = this.interaction.message.embeds[0];
        }
        return embed;
    }

    #render(embed) {
        if (this.interaction.isButton()) {
            this.interaction.update({
                embeds: [embed],
                components: this.layout()
            }).catch((error) => console.error(error));
        } else {
            this.interaction.reply({
                embeds: [embed],
                components: this.layout()
            }).catch((error) => console.error(error));
        }
    }

    update({ isFirst, isStopped, isQuit, song }) {
        if (isQuit) {
            this.interaction.update({content: 'Bye!', embeds: [], components:[]});
            this.collector.stop("");
        } else {
            const embed = this.#updateEmbed(song);
            this.#updatePrevBtn(isFirst);
            this.#updatePlayAndPauseBtn(isStopped);
            this.#render(embed);
        }
    }
}