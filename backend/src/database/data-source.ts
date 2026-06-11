import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { env } from '../config/env.config';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: env.DATABASE_URL,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTransactionMode: 'each',
  synchronize: false,
  logging: env.DATABASE_LOGGING,
  ssl: env.NODE_ENV === 'production'
    ? true
    : { rejectUnauthorized: false },
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;