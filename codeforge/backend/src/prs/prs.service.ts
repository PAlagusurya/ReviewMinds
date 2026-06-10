import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PullRequest } from '../db/entities/pull-request.entity';
import { Analysis } from '../db/entities/analysis.entity';

@Injectable()
export class PrsService {
  constructor(
    @InjectRepository(PullRequest)
    private readonly prRepo: Repository<PullRequest>,
    @InjectRepository(Analysis)
    private readonly analysisRepo: Repository<Analysis>,
  ) {}

  async findAll() {
    const analyses = await this.prRepo.find({
      order: {
        createdAt: 'DESC',
      },
    });

    const grouped = new Map<number, PullRequest[]>();

    for (const analysis of analyses) {
      const existing = grouped.get(analysis.prNumber) ?? [];

      existing.push(analysis);

      grouped.set(analysis.prNumber, existing);
    }

    return Array.from(grouped.values()).map((records) => {
      const latest = records[0];

      return {
        prNumber: latest.prNumber,
        title: latest.title,
        authorUsername: latest.authorUsername,
        status: latest.status,

        latestAnalysis: {
          id: latest.id,
          headSha: latest.headSha,
          qualityScore: latest.qualityScore,
          createdAt: latest.createdAt,
        },

        history: records.slice(1).map((record) => ({
          id: record.id,
          headSha: record.headSha,
          qualityScore: record.qualityScore,
          createdAt: record.createdAt,
        })),
      };
    });
  }

  async findByPrNumber(prNumber: number): Promise<PullRequest[]> {
    return this.prRepo.find({
      where: {
        prNumber,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findAnalysis(analysisId: string): Promise<PullRequest | null> {
    return this.prRepo.findOne({
      where: {
        id: analysisId,
      },
      relations: ['analyses'],
    });
  }
}
