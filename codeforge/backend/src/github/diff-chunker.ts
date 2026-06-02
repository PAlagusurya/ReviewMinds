import { ParsedHunk } from './diff-parser';

export interface DiffChunk {
  files: ParsedHunk[];
  tokenEstimate: number;
}

const CHARS_PER_TOKEN = 4;
const MAX_TOKENS_PER_CHUNK = 4000;

export function chunkDiff(hunks: ParsedHunk[]): DiffChunk[] {
  const chunks: DiffChunk[] = [];
  let current: DiffChunk = { files: [], tokenEstimate: 0 };

  for (const hunk of hunks) {
    const hunkTokens = estimateTokens(hunk);

    if (hunkTokens > MAX_TOKENS_PER_CHUNK) {
      if (current.files.length > 0) {
        chunks.push(current);
        current = { files: [], tokenEstimate: 0 };
      }
      chunks.push({ files: [hunk], tokenEstimate: hunkTokens });
      continue;
    }

    if (current.tokenEstimate + hunkTokens > MAX_TOKENS_PER_CHUNK) {
      chunks.push(current);
      current = { files: [], tokenEstimate: 0 };
    }

    current.files.push(hunk);
    current.tokenEstimate += hunkTokens;
  }

  if (current.files.length > 0) {
    chunks.push(current);
  }

  return chunks;
}

function estimateTokens(hunk: ParsedHunk): number {
  const text = hunk.filename + hunk.addedLines.map((l) => l.content).join('\n');
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}
