import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const fileExtension = __filename.endsWith('.ts') ? 'ts' : 'js';

const typeormConfig = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '..', 'database', 'entities', `*.entity.${fileExtension}`)],
  migrations: [join(__dirname, '..', 'database', 'migrations', `*.${fileExtension}`)],
  synchronize: false,
});

export default typeormConfig;
