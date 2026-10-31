import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  driver: 'd1-http',
  schema: './src/d1-schema.ts',
  out: './d1',
  dbCredentials: {
    accountId: '38f5da2e1935f394ed678b151934737e',
    databaseId: '00bc7849-2008-428c-8d97-8fab65a3c9d4',
    token: process.env.CLOUDFLARE_API_TOKEN ?? '',
  },
  strict: true,
  verbose: true,
});
