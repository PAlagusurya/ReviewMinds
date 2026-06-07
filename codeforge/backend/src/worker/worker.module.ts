import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullQueueModule } from '../bull/bull-queue.module';
import { GitHubModule } from '../github/github.module';
import { AnalysisModule } from '../analysis/anlaysis.module';
import { PrAnalysisProcessor } from './pr-analysis.processor';
import { PullRequest } from '../db/entities/pull-request.entity';
import { Analysis } from '../db/entities/analysis.entity';

@Module({
  imports: [
    BullQueueModule,
    GitHubModule,
    AnalysisModule,
    TypeOrmModule.forFeature([PullRequest, Analysis]),
  ],
  providers: [PrAnalysisProcessor],
})
export class WorkerModule {}
