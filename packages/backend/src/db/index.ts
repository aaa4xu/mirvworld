import { drizzle } from 'drizzle-orm/bun-sqlite';
import { Database } from 'bun:sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { config } from '../../config.ts';

const sqlite = new Database(config.database);
sqlite.exec('PRAGMA journal_mode = WAL;');

export const db = drizzle(sqlite);

// Apply migrations
migrate(db, { migrationsFolder: config.migrationsPath });
