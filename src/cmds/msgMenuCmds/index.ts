import { ActionRowBuilder, ApplicationCommandType, MessageContextMenuCommandInteraction, ModalBuilder, RESTPutAPIApplicationCommandsJSONBody, TextInputBuilder, TextInputStyle } from "discord.js";
import { logger } from "../../utils/logger";
import db from "../../db";
import { jokes, judges, ratings } from "../../db/schema";
import { eq } from "drizzle-orm";

enum CmdName {
    RATE_JOKE = '評分',
    GET_AVERAGE_RATES = '取得平均評分',
    GET_HISTORY_RATES = '取得詳細評分紀錄'
}

const commands = [
    {
        name: CmdName.RATE_JOKE,
        type: ApplicationCommandType.Message
    },
    {
        name: CmdName.GET_AVERAGE_RATES,
        type: ApplicationCommandType.Message
    },
    {
        name: CmdName.GET_HISTORY_RATES,
        type: ApplicationCommandType.Message
    }
] satisfies RESTPutAPIApplicationCommandsJSONBody

export function getMsgContextCmds() {
    // try {
    //     logger.info('registering msg menu cmds')
    //     // required functions before register msg menu cmds
    //     // await setupExchangeSync()
    //     return commands
    // } catch (err) {
    //     logger.error(`regiester msg menu cmds error: ${err}`)
    // }
    logger.info('registering msg menu cmds')
    return commands
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
    try {
        await interaction.showModal(modal)

        interaction.awaitModalSubmit({
            filter: function (inter) {
                return inter.customId === modalCustomId
            }, time: 30_000,
        }).then(async function (modalInteraction) {
            const score = Number(modalInteraction.fields.getTextInputValue('score'));
            const reason = modalInteraction.fields.getTextInputValue('reason');
            const { id, username } = user

            try {
                await db.insert(jokes).values({
                    dcMsgId: targetId,
                    content: targetMessage.content,
                    author: targetMessage.author.username
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
                modalInteraction.reply(`${targetMessage.author.username}：${targetMessage.content}\n${username} 的評分為 ${score}\n理由為: ${reason || '無'}`)
            } catch (err) {
                logger.error(`[ShowRateModal Modal Interaction Error]: ${err}`)
                modalInteraction.reply('Create Rating Failed. Please try again or contact yuliang_ting for help.')
            }
        })
    } catch (err) {
        logger.error(`[ShowRateModal Error]: ${err}`)
    }
}

async function getAverageRatingsOfJoke(interaction: MessageContextMenuCommandInteraction) {
    try {
        const historicalRatings = await db.select().from(ratings).where(eq(ratings.dcMsgId, interaction.targetMessage.id));
        const ratingCnts = historicalRatings.length;
        const averageRatings = ratingCnts > 0 ? historicalRatings.reduce(function (pre, cur) {
            return pre + cur.score
        }, 0) / ratingCnts : 0;
        const currentJudgeCntsOfJoke = historicalRatings
            .map(rating => rating.judgeId)
            .filter((value, index, self) => self.indexOf(value) === index).length
        interaction.reply(`${interaction.targetMessage.author.username}：${interaction.targetMessage.content}\n平均分數為${averageRatings}\n目前有${ratingCnts}筆評分紀錄，由${currentJudgeCntsOfJoke}人評分`)
    } catch (err) {
        logger.error(`[GetAverageRatingsOfJoke Error]: ${err}`)
        interaction.reply('Fetch historical ratings failed. Please try again later.')
    }
}

async function getHistoricalRatingsOfJoke(interaction: MessageContextMenuCommandInteraction) {
    try {
        const historicalRatings = await db.query.ratings.findMany({
            where: eq(ratings.dcMsgId, interaction.targetMessage.id),
            with: {
                judge: true,
            }
        });

        const ratingsGroupedByJudge: {
            [key: string]: typeof historicalRatings
        } = historicalRatings.reduce(function (pre, cur) {
            const { judge } = cur;
            const { judgeName } = judge
            const judgeIdHistory = pre[judgeName]
            if (judgeIdHistory) {
                return {
                    ...pre,
                    [judgeName]: [
                        ...judgeIdHistory,
                        cur
                    ]
                }
            }
            pre[judgeName] = [cur];
            return pre
        }, {})

        const ratingList = Object.entries(ratingsGroupedByJudge).map(function ([judge, ratingsOfJudge], i) {
            const ratingInfoHtml = ratingsOfJudge.map(function ({ score, reason, createTime }) {
                // intentionally leave space to create sub list.
                return `  ${i}. ${score}分；理由為：${reason || '無'}；評分時間：${createTime.toLocaleString()}`
            }).join('\n')
            return `- ${judge}: \n${ratingInfoHtml}`
        }).join('\n')

        interaction.reply(`${interaction.targetMessage.author.username}：${interaction.targetMessage.content}\n評分紀錄如下：\n${ratingList}`)
    } catch (err) {
        logger.error(`[GetHistoricalRatingsOfJoke Error]: ${err}`)
        interaction.reply('Fetch historical ratings failed. Please try again later.')
    }

}

export async function handleMsgContextMenuCmds(interaction: MessageContextMenuCommandInteraction) {
    if (interaction.commandName === CmdName.RATE_JOKE) {
        await showRateModal(interaction)
    }
    if (interaction.commandName === CmdName.GET_AVERAGE_RATES) {
        await getAverageRatingsOfJoke(interaction)
    }
    if (interaction.commandName === CmdName.GET_HISTORY_RATES) {
        await getHistoricalRatingsOfJoke(interaction)
    }
}