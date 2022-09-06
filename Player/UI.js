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
        this.collector = interaction.channel.createMessageComponentCollector({ componentType: "BUTTON" });
        this.collector.on('collect', async (interaction) => {
            this.interaction = interaction;
            switch (interaction.customId) {
                case 'Move':
                    await player.move(interaction);
                    break;
                case 'Quit':
                    await player.quit(interaction);
                    break;
                case 'Prev':
                    await player.prev(interaction);
                    break;
                case 'Play':
                    await player.resume(interaction);
                    break;
                case 'Stop':
                    await player.pause(interaction);
                    break;
                case 'Next':
                    await player.next(interaction);
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
                .setImage(song.thumbnail)
                .setURL(song.url);
        } else {
            embed = this.interaction.message.embeds[0];
        }
        return embed;
    }

    async #render(embed) {
        const message = {
            content: " ",
            embeds: [embed],
            components: this.layout()
        }

        if (this.interaction.isButton() && !this.interaction.replied) {
            await this.interaction.update(message).catch((error) => console.error(error));
        } else {
            await this.interaction.editReply(message).catch((error) => console.error(error));
        }
    }

    async dispose() {
        const message = {
            content: "Bye!!",
            embeds: [],
            components: []
        };

        if (this.interaction.isButton() && !this.interaction.replied) {
            await this.interaction.update(message).catch((error) => console.error(error));
        } else {
            await this.interaction.editReply(message).catch((error) => console.error(error));
        }
        this.collector.stop("");
    }

    async update({ isFirst, isStopped, song }) {
        const embed = this.#updateEmbed(song);
        this.#updatePrevBtn(isFirst);
        this.#updatePlayAndPauseBtn(isStopped);
        await this.#render(embed);
    }
}