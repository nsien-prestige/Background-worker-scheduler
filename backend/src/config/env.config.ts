import * as dotenv from 'dotenv';
dotenv.config();

const databaseURL = process.env.DATABASE_URL;
if (!databaseURL) {
  throw new Error('DATABASE_URL is not defined in environment variables');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: databaseURL,
  DATABASE_LOGGING: process.env.DATABASE_LOGGING === 'true',
};
