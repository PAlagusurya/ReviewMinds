import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { QUEUES } from './constants';

@Module({
  imports: [
    BullModule.registerQueue({
      name: QUEUES.ANALYZE_PR,
    }),
  ],
  exports: [BullModule],
})
export class BullQueueModule {}
