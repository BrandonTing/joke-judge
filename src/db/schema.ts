import { InferModel } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

// ratings - joke content, discord msg id, judge id, judge name, score, 
export const ratings = pgTable('ratings', {
    id: uuid('id').primaryKey().defaultRandom(),
    dcMsgId: text('msg_id').notNull(),
    content: text('msg_content').notNull(),
    judgeId: text('judge_id').notNull(),
    judgeName: text('judge_name').notNull(),
    score: integer('score').notNull(),
    reason: text('reason'),
    createTime: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type RatingType = InferModel<typeof ratings>
export type NewRating = InferModel<typeof ratings, 'insert'>
