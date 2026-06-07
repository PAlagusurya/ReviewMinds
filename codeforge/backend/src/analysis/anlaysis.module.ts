import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SecurityWorker } from './security.worker';
import { ComplexityWorker } from './complexity.worker';
import { TestGapsWorker } from './test-gaps.worker';
import { BreakingWorker } from './breaking.worker';

@Module({
  imports: [AiModule],
  providers: [SecurityWorker, ComplexityWorker, TestGapsWorker, BreakingWorker],
  exports: [SecurityWorker, ComplexityWorker, TestGapsWorker, BreakingWorker],
})
export class AnalysisModule {}
