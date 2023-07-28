import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema';
import env from '../utils/env';

const connectionString = env.DATABASE_URL
const client = postgres(connectionString)
export default drizzle(client, { schema });

