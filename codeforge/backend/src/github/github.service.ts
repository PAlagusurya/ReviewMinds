import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { readFileSync } from 'fs';
import { AppLogger } from 'src/logger/logger.service';
import { Finding } from '../analysis/types';
import { Severity } from 'src/analysis/enums/constants';

export interface PrFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface ReviewComment {
  path: string;
  line: number;
  body: string;
}

@Injectable()
export class GitHubService implements OnModuleInit {
  private appId: number;
  private privateKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  onModuleInit() {
    this.appId = Number(this.config.get<string>('GITHUB_APP_ID'));
    const keyPath = this.config.get<string>('GITHUB_PRIVATE_KEY_PATH') ?? '';
    this.privateKey = readFileSync(keyPath, 'utf-8');
  }

  private getOctokit(installationId: number): Octokit {
    return new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: this.appId,
        privateKey: this.privateKey,
        installationId,
      },
    });
  }

  async getPrFiles(
    repoFullName: string,
    prNumber: number,
    installationId: number,
  ): Promise<PrFile[]> {
    const [owner, repo] = repoFullName.split('/');
    const octokit = this.getOctokit(installationId);

    this.logger.log(`Fetching diff for PR #${prNumber} in ${repoFullName}`);

    const { data } = await octokit.pulls.listFiles({
      owner,
      repo,
      pull_number: prNumber,
      per_page: 100,
    });

    const files: PrFile[] = data.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
    }));

    this.logger.log(
      `Fetched ${files.length} files — ` +
        `${files.reduce((n, f) => n + f.additions, 0)} additions, ` +
        `${files.reduce((n, f) => n + f.deletions, 0)} deletions`,
    );

    return files;
  }

  async postReview(
    repoFullName: string,
    prNumber: number,
    installationId: number,
    findings: Finding[],
    qualityScore: number,
  ): Promise<void> {
    const [owner, repo] = repoFullName.split('/');
    console.log(`Posting review for PR #${prNumber} in ${repoFullName}`);
    const octokit = this.getOctokit(installationId);

    const comments: ReviewComment[] = findings
      .filter((f) => f.line > 0)
      .map((f) => ({
        path: f.file,
        line: f.line,
        body: this.formatComment(f),
      }));

    const summary = this.formatSummary(findings, qualityScore);

    await octokit.pulls.createReview({
      owner,
      repo,
      pull_number: prNumber,
      event: 'COMMENT',
      body: summary,
      comments,
    });

    this.logger.log(
      `Posted review on PR #${prNumber} — ${comments.length} inline comments`,
    );
  }

  private formatComment(finding: Finding): string {
    const severityEmoji: Record<string, string> = {
      high: '🔴',
      medium: '🟡',
      low: '🔵',
      info: 'ℹ️',
    };

    const emoji = severityEmoji[finding.severity] ?? 'ℹ️';

    return [
      `${emoji} **${finding.severity.toUpperCase()}** — ${finding.category}`,
      '',
      finding.explanation,
      '',
      '**Suggested fix:**',
      '```',
      finding.fix,
      '```',
    ].join('\n');
  }

  private formatSummary(findings: Finding[], score: number): string {
    const high = findings.filter((f) => f.severity === Severity.HIGH).length;
    const medium = findings.filter(
      (f) => f.severity === Severity.MEDIUM,
    ).length;
    const low = findings.filter((f) => f.severity === Severity.LOW).length;

    const scoreEmoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : '🔴';

    return [
      `## CodeForge Analysis ${scoreEmoji}`,
      '',
      `**Quality Score: ${score}/100**`,
      '',
      '| Severity | Count |',
      '|----------|-------|',
      `| 🔴 High   | ${high} |`,
      `| 🟡 Medium | ${medium} |`,
      `| 🔵 Low    | ${low} |`,
      '',
      findings.length === 0
        ? '✅ No issues found. Good work!'
        : `${findings.length} issue(s) found. See inline comments for details.`,
    ].join('\n');
  }
}
