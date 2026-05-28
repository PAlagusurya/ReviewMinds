import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { BullQueueModule } from 'src/bull/bull-queue.module';

@Module({
  imports: [BullQueueModule],
  controllers: [HealthController],
})
export class HealthModule {}
