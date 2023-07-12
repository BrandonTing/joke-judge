import { str, envsafe, } from 'envsafe';

export const env = envsafe({
    NODE_ENV: str({
        devDefault: 'dev',
        choices: ['dev', 'test', 'production'],
    }),
    // add discord keys
    DISCORD_BOT_TOKEN: str({
        desc: 'DISCORD Application 的token'
    }),
    DISCORD_BOT_CLIENT_ID: str({
        desc: 'ID of bot'
    }),
});
