import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { Workspace } from './entities/workspace.entity';
import { PullRequest } from './entities/pull-request.entity';
import { Analysis } from './entities/analysis.entity';
import { AnalysisJob } from './entities/analysis-job.entity';

config({ path: '../.env' });

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [Workspace, PullRequest, Analysis, AnalysisJob],
  migrations: ['src/db/migrations/*{.ts,.js}'],
});
