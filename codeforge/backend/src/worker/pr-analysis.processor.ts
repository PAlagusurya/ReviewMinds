import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { QUEUES } from '../bull/constants';
import { GitHubService } from '../github/github.service';
import { parseDiff } from '../github/diff-parser';
import { chunkDiff } from '../github/diff-chunker';

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

  constructor(private readonly githubService: GitHubService) {
    super();
  }

  async process(job: Job<PrJobPayload>): Promise<void> {
    const { prNumber, repoFullName, headSha, installationId } = job.data;

    this.logger.log(
      `Job ${job.id} started — PR #${prNumber} in ${repoFullName}`,
    );
    this.logger.log(`Head SHA: ${headSha}`);

    // 1. fetch raw file list + patches from GitHub
    const files = await this.githubService.getPrFiles(
      repoFullName,
      prNumber,
      installationId,
    );

    // 2. parse into structured hunks
    const hunks = parseDiff(files);
    this.logger.log(`Parsed ${hunks.length} changed files`);

    // 3. chunk into token-budget pieces
    const chunks = chunkDiff(hunks);
    this.logger.log(`Split into ${chunks.length} chunk(s) for analysis`);

    // 4. log each chunk summary
    chunks.forEach((chunk, i) => {
      const fileNames = chunk.files.map((f) => f.filename).join(', ');
      this.logger.log(
        `Chunk ${i + 1}/${chunks.length}: ~${chunk.tokenEstimate} tokens — ${fileNames}`,
      );
    });

    //pass chunks to AI workers here
    this.logger.log(`Job ${job.id} complete — ready for AI analysis`);
  }
}
