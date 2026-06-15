export interface LatestAnalysis {
  id: string;
  headSha: string;
  qualityScore: number | null;
  createdAt: string;
}

export interface PRSummary {
  prNumber: number;
  title: string;
  authorUsername: string;
  status: "pending" | "analyzing" | "complete" | "failed";
  latestAnalysis: LatestAnalysis;
  history: LatestAnalysis[];
}

export interface AnalysisItem {
  id: string;
  headSha: string;
  qualityScore: number | null;
  status: string;
  createdAt: string;
}

export interface PRDetail {
  prNumber: number;
  title: string;
  authorUsername: string;
  analyses: AnalysisItem[];
}

export interface Finding {
  id: string;
  workerType: "security" | "complexity" | "test-gaps" | "breaking";
  filePath: string;
  lineNumber: number;
  severity: "high" | "medium" | "low" | "info";
  category: string;
  explanation: string;
  fixSuggestion: string;
  createdAt: string;
}
