import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PullRequest } from './pull-request.entity';

@Entity('analyses')
export class Analysis {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // which worker found this — security | complexity | test-gaps | breaking-changes
  @Column()
  workerType: string;

  // which file the issue was found in
  @Column({ nullable: true })
  filePath: string;

  // exact line number — maps to GitHub inline comment position
  @Column({ nullable: true })
  lineNumber: number;

  // high | medium | low
  @Column({ nullable: true })
  severity: string;

  // sql-injection | xss | cyclomatic-complexity | missing-test etc
  @Column({ nullable: true })
  category: string;

  // what the AI found — shown in GitHub comment
  @Column({ type: 'text', nullable: true })
  explanation: string;

  // exact fix suggestion — shown in GitHub comment
  @Column({ type: 'text', nullable: true })
  fixSuggestion: string;

  // GitHub comment ID — set after we post the review
  @Column({ nullable: true })
  githubCommentId: number;

  @CreateDateColumn()
  createdAt: Date;

  // many findings belong to one PR
  @ManyToOne(() => PullRequest, (pr) => pr.analyses)
  @JoinColumn()
  pullRequest: PullRequest;
}
