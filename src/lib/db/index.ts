import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Only check DATABASE_URL on server side
if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Only create database connection on server side
let db: ReturnType<typeof drizzle>;

if (typeof window === 'undefined') {
  // Disable prefetch as it is not supported for "Transaction" pool mode
  const client = postgres(process.env.DATABASE_URL!, { prepare: false });
  db = drizzle(client, { schema });
} else {
  // On client side, create a dummy object to prevent errors
  db = {} as ReturnType<typeof drizzle>;
}

export { db };

export * from './schema';
