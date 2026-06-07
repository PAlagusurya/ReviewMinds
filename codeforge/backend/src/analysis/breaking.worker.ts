import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { BREAKING_PROMPT } from '../ai/prompts/breaking.prompt';
import { DiffChunk } from '../github/diff-chunker';
import { PrFile } from '../github/github.service';
import { Finding, WorkerResult } from './types';
import { WorkerType } from './enums/constants';

@Injectable()
export class BreakingWorker {
  constructor(private readonly ai: AiService) {}

  async analyze(
    chunks: DiffChunk[],
    rawFiles: PrFile[],
  ): Promise<WorkerResult> {
    const allFindings: Finding[] = [];

    for (const chunk of chunks) {
      const diffContent = formatChunkWithContext(chunk, rawFiles);
      const findings = await this.ai.analyzeChunk(
        BREAKING_PROMPT,
        diffContent,
        WorkerType.BREAKING,
      );
      allFindings.push(...findings);
    }

    return { workerType: WorkerType.BREAKING, findings: allFindings };
  }
}

function formatChunkWithContext(chunk: DiffChunk, rawFiles: PrFile[]): string {
  return chunk.files
    .map((f) => {
      const raw = rawFiles.find((r) => r.filename === f.filename);
      return `### ${f.filename}\n${raw?.patch ?? '(no patch available)'}`;
    })
    .join('\n\n');
}
