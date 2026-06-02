import { Module } from '@nestjs/common';
import { BullQueueModule } from '../bull/bull-queue.module';
import { GitHubModule } from '../github/github.module';
import { PrAnalysisProcessor } from './pr-analysis.processor';

@Module({
  imports: [BullQueueModule, GitHubModule],
  providers: [PrAnalysisProcessor],
})
export class WorkerModule {}
