import { InferModel, relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const judges = pgTable('judges', {
    judgeId: text('judge_id').notNull().primaryKey(),
    judgeName: text('judge_name').notNull(),
    createTime: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const jokes = pgTable('jokes', {
    dcMsgId: text('msg_id').notNull().primaryKey(),
    content: text('msg_content').notNull(),
    createTime: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const ratings = pgTable('ratings', {
    id: uuid('id').primaryKey().defaultRandom(),
    dcMsgId: text('msg_id').notNull(),
    judgeId: text('judge_id').notNull(),
    score: integer('score').notNull(),
    reason: text('reason'),
    createTime: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const judgeRatingsRelation = relations(judges, function ({ many }) {
    return {
        ratings: many(ratings)
    }
})

export const jokeRatingsRelation = relations(jokes, function ({ many }) {
    return {
        ratings: many(ratings)
    }
})


export const ratingsRelations = relations(ratings, function ({ one }) {
    return {
        joke: one(jokes, {
            fields: [ratings.dcMsgId],
            references: [jokes.dcMsgId]
        }),
        judge: one(judges, {
            fields: [ratings.judgeId],
            references: [judges.judgeId]
        })
    }
})

export type RatingType = InferModel<typeof ratings>
