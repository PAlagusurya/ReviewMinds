import { Processor, WorkerHost } from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { QUEUES } from '../bull/constants';
import { GitHubService } from '../github/github.service';
import { parseDiff } from '../github/diff-parser';
import { chunkDiff } from '../github/diff-chunker';
import { AppLogger } from 'src/logger/logger.service';
import { SecurityWorker } from '../analysis/security.worker';
import { ComplexityWorker } from '../analysis/complexity.worker';
import { TestGapsWorker } from '../analysis/test-gaps.worker';
import { BreakingWorker } from '../analysis/breaking.worker';
import { computeQualityScore } from '../analysis/scorer';
import { PullRequest } from '../db/entities/pull-request.entity';
import { Analysis } from '../db/entities/analysis.entity';
import { Finding } from '../analysis/types';

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
  constructor(
    private readonly githubService: GitHubService,
    private readonly loggerService: AppLogger,
    private readonly securityWorker: SecurityWorker,
    private readonly complexityWorker: ComplexityWorker,
    private readonly testGapsWorker: TestGapsWorker,
    private readonly breakingWorker: BreakingWorker,
    @InjectRepository(PullRequest)
    private readonly prRepo: Repository<PullRequest>,
    @InjectRepository(Analysis)
    private readonly analysisRepo: Repository<Analysis>,
  ) {
    super();
  }

  async process(job: Job<PrJobPayload>): Promise<void> {
    const {
      prNumber,
      repoFullName,
      headSha,
      baseBranch,
      title,
      author,
      installationId,
    } = job.data;

    this.loggerService.log(
      `Job ${job.id} started — PR #${prNumber} in ${repoFullName}`,
    );
    this.loggerService.log(`Head SHA: ${headSha}`);

    // 1. upsert pull request record
    const pr = await this.prRepo.save(
      this.prRepo.create({
        prNumber,
        headSha,
        baseBranch,
        title,
        authorUsername: author,
        status: 'analyzing',
      }),
    );

    try {
      // 2. fetch diff
      const files = await this.githubService.getPrFiles(
        repoFullName,
        prNumber,
        installationId,
      );

      // 3. parse + chunk
      const hunks = parseDiff(files);
      const chunks = chunkDiff(hunks);
      this.loggerService.log(
        `${files.length} files → ${hunks.length} hunks → ${chunks.length} chunk(s)`,
      );

      // 4. run all 4 workers in parallel
      const [security, complexity, testGaps, breaking] =
        await Promise.allSettled([
          this.securityWorker.analyze(chunks),
          this.complexityWorker.analyze(chunks),
          this.testGapsWorker.analyze(chunks),
          this.breakingWorker.analyze(chunks, files),
        ]);

      // 5. collect findings — partial results if any worker failed
      const allFindings: Finding[] = [
        security,
        complexity,
        testGaps,
        breaking,
      ].flatMap((result) => {
        if (result.status === 'fulfilled') {
          return result.value.findings.map((f) => ({
            ...f,
            workerType: result.value.workerType,
          }));
        }
        this.loggerService.warn(`Worker failed: ${String(result.reason)}`);
        return [];
      });

      this.loggerService.log(`Total findings: ${allFindings.length}`);

      // 6. compute quality score
      const qualityScore = computeQualityScore(allFindings);
      this.loggerService.log(`Quality score: ${qualityScore}/100`);

      // 7. save findings to Postgres
      if (allFindings.length > 0) {
        const findingEntities = allFindings.map((f) =>
          this.analysisRepo.create({
            pullRequest: pr,
            workerType: f.workerType,
            filePath: f.file,
            lineNumber: f.line,
            severity: f.severity,
            category: f.category,
            explanation: f.explanation,
            fixSuggestion: f.fix,
          }),
        );
        await this.analysisRepo.save(findingEntities);
      }

      // 8. update PR record with score + status
      await this.prRepo.save({
        ...pr,
        status: 'complete',
        qualityScore,
      });

      // 9. post review to GitHub
      await this.githubService.postReview(
        repoFullName,
        prNumber,
        installationId,
        allFindings,
        qualityScore,
      );

      this.loggerService.log(
        `Job ${job.id} complete — score: ${qualityScore}/100`,
      );
    } catch (error) {
      await this.prRepo.save({ ...pr, status: 'failed' });
      this.loggerService.error(`Job ${job.id} failed`, String(error));
      throw error;
    }
  }
}
