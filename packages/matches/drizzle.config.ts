import { defineConfig } from 'drizzle-kit';
import { config } from './config.ts';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'mysql',
  dbCredentials: {
    url: config.db,
  },
});
