import { Module } from '@nestjs/common';
import { BullQueueModule } from '../bull/bull-queue.module';
import { PrAnalysisProcessor } from './pr-analysis.processor';

@Module({
  imports: [BullQueueModule],
  providers: [PrAnalysisProcessor],
})
export class WorkerModule {}
