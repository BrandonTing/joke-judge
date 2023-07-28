import { z } from 'zod';

const envSchema = z.object({
    DISCORD_BOT_TOKEN: z.string(),
    DISCORD_BOT_CLIENT_ID: z.string(),
    DATABASE_URL: z.string(),
})

export default envSchema.parse(process.env)