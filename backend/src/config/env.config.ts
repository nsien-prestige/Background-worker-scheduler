import * as dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000'),

  DATABASE_URL: process.env.DATABASE_URL!,
  DATABASE_LOGGING: process.env.DATABASE_LOGGING === 'true',
};

if (!env.DATABASE_URL) {
  console.error('Missing required DATABASE_URL environment variable');
  process.exit(1);
}