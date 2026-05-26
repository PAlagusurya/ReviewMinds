import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { PullRequest } from './pull-request.entity';

@Entity('workspaces')
export class Workspace {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // GitHub repo full name — "org/repo"
  @Column({ unique: true })
  repoFullName: string;

  // GitHub's internal repo ID
  @Column({ nullable: true })
  githubRepoId: number;

  // who installed CodeForge on this repo
  @Column()
  ownerGithubUsername: string;

  @CreateDateColumn()
  createdAt: Date;

  // one workspace has many pull requests
  @OneToMany(() => PullRequest, (pr) => pr.workspace)
  pullRequests: PullRequest[];
}
