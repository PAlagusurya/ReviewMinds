import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { QUEUES } from '../bull/constants';

// define what job.data looks like
interface PrJobPayload {
  prNumber: number;
  repoFullName: string;
  headSha: string;
}

@Processor(QUEUES.ANALYZE_PR)
export class PrAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(PrAnalysisProcessor.name);

  async process(job: Job<PrJobPayload>) {
    this.logger.log(`Picked up job ${job.id}`);
    this.logger.log(`PR: #${job.data.prNumber} in ${job.data.repoFullName}`);
    // simulate async analysis work
    await new Promise((resolve) => setTimeout(resolve, 2000));

    this.logger.log(`Job ${job.id} complete`);
  }
}
