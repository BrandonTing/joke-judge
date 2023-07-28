import "dotenv/config"
import env from "./utils/env"
import { Client, IntentsBitField, REST, RESTPutAPIApplicationCommandsJSONBody, Routes, } from "discord.js"
import { logger } from "./utils/logger"
import { getMsgContextCmds, handleMsgContextMenuCmds } from "./cmds/msgMenuCmds";

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
    ]
})

async function registerCmds(rest: REST, cmds: RESTPutAPIApplicationCommandsJSONBody) {
    try {
        logger.info('registering cmds')
        // await setupExchangeSync()
        await rest.put(Routes.applicationCommands(env.DISCORD_BOT_CLIENT_ID), {
            body: cmds
        })
    } catch (err) {
        logger.error(`regiester cmds error: ${err}`)
    }
}


client.on('ready', async () => {
    const rest = new REST({ version: '10' }).setToken(env.DISCORD_BOT_TOKEN);
    const msgMenuCmds = getMsgContextCmds()
    try {
        await registerCmds(rest, [...msgMenuCmds])
        logger.info('online ')
    } catch (err) {
        logger.error(`[registerCmds] err: ${err}`)
        throw new Error("Register Failed");
    }
})

client.on('interactionCreate', async interaction => {
    // ignore other interacrtions for now except for slash cmds
    if (interaction.isMessageContextMenuCommand()) {
        await handleMsgContextMenuCmds(interaction)
    }
})

// client.on('messageCreate', (message) => {
//     logger.info(message);
// })

client.login(env.DISCORD_BOT_TOKEN)
