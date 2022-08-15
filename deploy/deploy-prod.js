const fs = require('fs');
const dotenv = require('dotenv');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');


// ENV
dotenv.config();
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;


// LOAD COMMANDS
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    commands.push(command.data.toJSON());
}


// PUBLISH COMMANDS
const publish = async () => {
    const rest = new REST({ version: '9' }).setToken(TOKEN);

    const data = await rest.get(Routes.applicationCommands(CLIENT_ID));
    const promises = [];
    for (const command of data) {
        const deleteUrl = `${Routes.applicationCommands(CLIENT_ID)}/${command.id}`;
        promises.push(rest.delete(deleteUrl));
    }
    await Promise.all(promises);
    
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands })
}

publish()
    .then(() => console.log('Successfully registered application commands.'))
    .catch((error) => console.error(error))