import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

const migrationClient = postgres(process.env.DATABASE_URL, { max: 1 });

async function runMigrations() {
  try {
    console.log('Running migrations...');
    await migrate(drizzle(migrationClient), { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await migrationClient.end();
  }
}

if (require.main === module) {
  runMigrations();
}

export { runMigrations };
