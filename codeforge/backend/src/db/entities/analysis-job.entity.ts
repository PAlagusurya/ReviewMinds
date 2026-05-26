import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PullRequest } from './pull-request.entity';

@Entity('analysis_jobs')
export class AnalysisJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // which worker this job belongs to
  @Column()
  workerType: string; // security | complexity | test-gaps | breaking-changes

  // lifecycle status
  @Column({ default: 'queued' })
  status: string; // queued | active | completed | failed

  // BullMQ's internal job ID — links our DB row to Redis job
  @Column({ nullable: true })
  bullJobId: string;

  // error message if failed
  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  // how many times this job has been retried
  @Column({ default: 0 })
  retryCount: number;

  @CreateDateColumn()
  createdAt: Date;

  // auto-updates every time this row changes
  @UpdateDateColumn()
  updatedAt: Date;

  // many jobs belong to one PR
  @ManyToOne(() => PullRequest, (pr) => pr.analysisJobs)
  @JoinColumn()
  pullRequest: PullRequest;
}
