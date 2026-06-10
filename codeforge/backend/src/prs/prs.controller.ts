import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PrsService } from './prs.service';

@Controller('prs')
export class PrsController {
  constructor(private readonly prsService: PrsService) {}

  @Get()
  async findAll() {
    const prs = await this.prsService.findAll();

    return {
      data: prs,
    };
  }
  @Get(':prNumber')
  async findByPrNumber(@Param('prNumber') prNumber: string) {
    const analyses = await this.prsService.findByPrNumber(Number(prNumber));

    if (!analyses.length) {
      throw new NotFoundException(`PR #${prNumber} not found`);
    }

    return {
      data: {
        prNumber: analyses[0].prNumber,
        title: analyses[0].title,
        authorUsername: analyses[0].authorUsername,
        analyses: analyses.map((a) => ({
          id: a.id,
          headSha: a.headSha,
          qualityScore: a.qualityScore,
          status: a.status,
          createdAt: a.createdAt,
        })),
      },
    };
  }

  @Get('analyses/:analysisId/findings')
  async findFindings(
    @Param('analysisId')
    analysisId: string,
  ) {
    const analysis = await this.prsService.findAnalysis(analysisId);

    if (!analysis) {
      throw new NotFoundException('Analysis not found');
    }

    return {
      data: analysis.analyses,
    };
  }
}
