import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { COMPLEXITY_PROMPT } from '../ai/prompts/complexity.prompt';
import { DiffChunk } from '../github/diff-chunker';
import { Finding, WorkerResult } from './types';
import { WorkerType } from './enums/constants';

@Injectable()
export class ComplexityWorker {
  constructor(private readonly ai: AiService) {}

  async analyze(chunks: DiffChunk[]): Promise<WorkerResult> {
    const allFindings: Finding[] = [];

    for (const chunk of chunks) {
      const diffContent = formatChunk(chunk);
      const findings = await this.ai.analyzeChunk(
        COMPLEXITY_PROMPT,
        diffContent,
        WorkerType.COMPLEXITY,
      );
      allFindings.push(...findings);
    }

    return { workerType: WorkerType.COMPLEXITY, findings: allFindings };
  }
}

function formatChunk(chunk: DiffChunk): string {
  return chunk.files
    .map((f) => {
      const lines = f.addedLines
        .map((l) => `+${l.lineNumber}: ${l.content}`)
        .join('\n');
      return `### ${f.filename}\n${lines}`;
    })
    .join('\n\n');
}
