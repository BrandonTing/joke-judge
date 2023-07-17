import { ActionRowBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction, ModalBuilder, RESTPutAPIApplicationCommandsJSONBody, TextInputBuilder, TextInputStyle } from "discord.js";
import { logger } from "../../utils/logger";
import db from "../../db";
import { jokes, judges, ratings } from "../../db/schema";
import { eq } from "drizzle-orm";

enum CmdName {
    RATE_JOKE = '評分',
    GET_AVERAGE_RATES = '取得此笑話平均評分'
}

const commands = [
    {
        name: CmdName.RATE_JOKE,
        type: ApplicationCommandType.Message
    },
    {
        name: CmdName.GET_AVERAGE_RATES,
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

        await db.insert(jokes).values({
            dcMsgId: targetId,
            content: targetMessage.content,
        }).onConflictDoNothing()

        await db.insert(judges).values({
            judgeId: id,
            judgeName: username,
        }).onConflictDoNothing()

        await db.insert(ratings).values({
            dcMsgId: targetId,
            judgeId: id,
            score,
            reason,
        })
        logger.info('saved to db')
        modalInteraction.reply(`${username} 的評分為 ${score}\n理由為: ${reason || '無'}`)
    })
}

async function getAverageRatingsOfJoke(interaction: MessageContextMenuCommandInteraction) {
    const historicalRatings = await db.select().from(ratings).where(eq(ratings.dcMsgId, interaction.targetMessage.id));
    const ratingCnts = historicalRatings.length;
    const averageRatings = ratingCnts > 0 ? historicalRatings.reduce(function (pre, cur) {
        return pre + cur.score
    }, 0) / ratingCnts : 0;
    const currentJudgeCntsOfJoke = historicalRatings.map(rating => rating.judgeId).filter((value, index, self) => self.indexOf(value) !== index).length
    interaction.reply(`笑話內容：${interaction.targetMessage.content}\n平均分數為${averageRatings}\n目前有${ratingCnts}筆評分紀錄，由${currentJudgeCntsOfJoke}人評分`)
}

export async function handleMsgContextMenuCmds(interaction: MessageContextMenuCommandInteraction) {
    if (interaction.commandName === CmdName.RATE_JOKE) {
        await showRateModal(interaction)
    }
    if (interaction.commandName === CmdName.GET_AVERAGE_RATES) {
        await getAverageRatingsOfJoke(interaction)
    }
}