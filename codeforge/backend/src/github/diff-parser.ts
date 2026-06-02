import { PrFile } from './github.service';

export interface ParsedHunk {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  addedLines: AddedLine[];
}

export interface AddedLine {
  lineNumber: number;
  content: string;
}

export function parseDiff(files: PrFile[]): ParsedHunk[] {
  return files
    .filter((f) => f.patch && f.status !== 'removed')
    .map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      addedLines: extractAddedLines(f.patch!),
    }));
}

function extractAddedLines(patch: string): AddedLine[] {
  const lines = patch.split('\n');
  const addedLines: AddedLine[] = [];
  let currentLineNumber = 0;

  for (const line of lines) {
    const hunkMatch = line.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
    if (hunkMatch) {
      currentLineNumber = parseInt(hunkMatch[1], 10) - 1;
      continue;
    }

    if (line.startsWith('-')) continue;

    if (line.startsWith('+')) {
      currentLineNumber++;
      addedLines.push({
        lineNumber: currentLineNumber,
        content: line.slice(1),
      });
      continue;
    }

    currentLineNumber++;
  }

  return addedLines;
}
