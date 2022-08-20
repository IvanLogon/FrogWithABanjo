//Dependencies
const fs = require('fs');
const dotenv = require('dotenv');
const { Client, Collection, Intents } = require('discord.js');


// ENV
dotenv.config();
const TOKEN = process.env.TOKEN;


//Initialization
const client = new Client({
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_VOICE_STATES
    ]
});
client.commands = new Collection();
client.players = new Collection();


//Commands
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (let file of commandFiles) {
    let command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}


//Events
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    //Check type of interaction
    if (!interaction.isCommand()) return;
    //Command
    if (!client.commands.has(interaction.commandName)) return;
    //Execute
    client.commands.get(interaction.commandName)
        .execute(interaction)
        .catch((error) => {
            console.error(error);
            return interaction.reply({
                content: 'There was an error while executing this command!',
                ephemeral: true
            });
        });
});

client.login(TOKEN);

// Server for uptimerobot
//require('http').createServer((req, res) => res.end('Bot is alive!')).listen(3000);