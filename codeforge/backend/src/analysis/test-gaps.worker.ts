import { Injectable } from '@nestjs/common';
import { AiService } from '../ai/ai.service';
import { TEST_GAPS_PROMPT } from '../ai/prompts/test-gaps.prompt';
import { DiffChunk } from '../github/diff-chunker';
import { Finding, WorkerResult } from './types';
import { WorkerType } from './enums/constants';

@Injectable()
export class TestGapsWorker {
  constructor(private readonly ai: AiService) {}

  async analyze(chunks: DiffChunk[]): Promise<WorkerResult> {
    const allFindings: Finding[] = [];

    for (const chunk of chunks) {
      const diffContent = formatChunk(chunk);
      const findings = await this.ai.analyzeChunk(
        TEST_GAPS_PROMPT,
        diffContent,
        WorkerType.TEST_GAPS,
      );
      allFindings.push(...findings);
    }

    return { workerType: WorkerType.TEST_GAPS, findings: allFindings };
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
