import { ActionRowBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction, ModalBuilder, RESTPutAPIApplicationCommandsJSONBody, TextInputBuilder, TextInputStyle } from "discord.js";
import { logger } from "../../utils/logger";
import db from "../../db";
import { NewRating, ratings } from "../../db/schema";

enum CmdName {
    RATE_JOKE = '評分',
    GET_RATES = '取得此笑話歷史評分'
}

const commands = [
    {
        name: CmdName.RATE_JOKE,
        type: ApplicationCommandType.Message
    },
    {
        name: CmdName.GET_RATES,
        type: ApplicationCommandType.Message
    }

] satisfies RESTPutAPIApplicationCommandsJSONBody

export function getMsgContextCmds() {
    try {
        logger.info('registering msg menu cmds')
        // required functions before register msg menu cmds
        // await setupExchangeSync()
        return commands
    } catch (err) {
        logger.error(`regiester msg menu cmds error: ${err}`)
    }
}

async function showRateModal(interaction: MessageContextMenuCommandInteraction) {
    const { id, targetId, user, targetMessage, } = interaction
    const modalCustomId = `joke-rate-${id}`
    const modal = new ModalBuilder({
        customId: modalCustomId,
        title: '笑話評分系統'
    })
    const scoreComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder({
        customId: 'score',
        label: '您對此笑話的評分',
        style: TextInputStyle.Short,
        required: true
    }))
    const reasonComponent = new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder({
        customId: 'reason',
        label: '簡述您對此笑話的看法，非必填',
        style: TextInputStyle.Paragraph,
        required: false
    }))

    modal.addComponents(scoreComponent, reasonComponent)

    await interaction.showModal(modal)

    interaction.awaitModalSubmit({
        filter: function (inter) {
            return inter.customId === modalCustomId
        }, time: 30_000,
    }).then(async function (modalInteraction) {
        const score = Number(modalInteraction.fields.getTextInputValue('score'));
        const reason = modalInteraction.fields.getTextInputValue('reason');
        const { id, username } = user
        const newRating: NewRating = {
            dcMsgId: targetId,
            content: targetMessage.content,
            judgeId: id,
            judgeName: username,
            score,
            reason,
        }
        await db.insert(ratings).values(newRating)
        logger.info('saved to db')
        modalInteraction.reply(`${username} 的評分為 ${score}\n理由為: ${reason}`)
    })
}


export async function handleMsgContextMenuCmds(interaction: MessageContextMenuCommandInteraction) {
    if (interaction.commandName === CmdName.RATE_JOKE) {
        await showRateModal(interaction)
    }
    // if (interaction.commandName === CmdName.GET_RATES) {
    //     await handleTranslateToJP(interaction)
    // }
}