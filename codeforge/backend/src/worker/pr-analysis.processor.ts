import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUES } from '../bull/constants';

interface PrJobPayload {
  prNumber: number;
  repoFullName: string;
  headSha: string;
  baseBranch: string;
  title: string;
  author: string;
  installationId: number;
}

@Processor(QUEUES.ANALYZE_PR)
export class PrAnalysisProcessor extends WorkerHost {
  private readonly logger = new Logger(PrAnalysisProcessor.name);

  async process(job: Job<PrJobPayload>): Promise<void> {
    const { prNumber, repoFullName, headSha, installationId } = job.data;

    this.logger.log(`Picked up job ${job.id}`);
    this.logger.log(`PR #${prNumber} in ${repoFullName}`);
    this.logger.log(`Head SHA: ${headSha}`);
    this.logger.log(`Installation ID: ${installationId}`);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    this.logger.log(`Job ${job.id} complete`);
  }
}
