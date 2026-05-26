import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Workspace } from './workspace.entity';
import { Analysis } from './analysis.entity';
import { AnalysisJob } from './analysis-job.entity';

@Entity('pull_requests')
export class PullRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // GitHub's PR number — the #42 you see in GitHub UI
  @Column()
  prNumber: number;

  @Column({ nullable: true })
  title: string;

  // the latest commit SHA on this PR
  @Column()
  headSha: string;

  // which branch this PR is merging into
  @Column({ nullable: true })
  baseBranch: string;

  // who opened the PR
  @Column({ nullable: true })
  authorUsername: string;

  // overall quality score 0-100
  @Column({ nullable: true })
  qualityScore: number;

  // where is this PR in the analysis lifecycle
  @Column({ default: 'pending' })
  status: string; // pending | analyzing | complete | failed

  @CreateDateColumn()
  createdAt: Date;

  // many PRs belong to one workspace
  @ManyToOne(() => Workspace, (workspace) => workspace.pullRequests)
  @JoinColumn()
  workspace: Workspace;

  // one PR has many analysis findings
  @OneToMany(() => Analysis, (analysis) => analysis.pullRequest)
  analyses: Analysis[];

  // one PR has many analysis jobs (one per worker type)
  @OneToMany(() => AnalysisJob, (job) => job.pullRequest)
  analysisJobs: AnalysisJob[];
}
