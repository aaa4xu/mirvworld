import { defineConfig } from 'drizzle-kit';
import { config } from './config.ts';

export default defineConfig({
  out: config.migrationsPath,
  schema: './src/db/schema.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: config.database,
  },
});
