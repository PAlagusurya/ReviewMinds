import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { readFileSync } from 'fs';

export interface PrFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

@Injectable()
export class GitHubService implements OnModuleInit {
  private readonly logger = new Logger(GitHubService.name);
  private appId: number;
  private privateKey: string;

  constructor(private readonly config: ConfigService) {}

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
}
