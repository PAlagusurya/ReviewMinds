import { Finding } from "@/types/api";

const SEVERITY_STYLES: Record<
  string,
  {
    border: string;
    badge: string;
    emoji: string;
  }
> = {
  high: {
    border: "border-red-200",
    badge: "bg-red-100 text-red-800",
    emoji: "🔴",
  },
  medium: {
    border: "border-yellow-200",
    badge: "bg-yellow-100 text-yellow-800",
    emoji: "🟡",
  },
  low: {
    border: "border-blue-200",
    badge: "bg-blue-100 text-blue-800",
    emoji: "🔵",
  },
  info: {
    border: "border-gray-200",
    badge: "bg-gray-100 text-gray-700",
    emoji: "ℹ️",
  },
};

const WORKER_LABELS: Record<string, string> = {
  security: "🛡 Security",
  complexity: "📐 Complexity",
  "test-gaps": "🧪 Test Gaps",
  breaking: "⚡ Breaking",
};

export function FindingCard({ finding }: { finding: Finding }) {
  const style = SEVERITY_STYLES[finding.severity] ?? SEVERITY_STYLES.info;

  return (
    <div className={`rounded-lg border ${style.border} bg-white p-4`}>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${style.badge}`}
        >
          {style.emoji} {finding.severity}
        </span>
        <span className="text-xs font-medium text-gray-500">
          {finding.category}
        </span>
        <span className="text-xs text-gray-400">
          {WORKER_LABELS[finding.workerType] ?? finding.workerType}
        </span>
        <span className="ml-auto font-mono text-xs text-gray-400">
          {finding.filePath}:{finding.lineNumber}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-800">{finding.explanation}</p>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Suggested fix
        </p>
        <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs text-gray-700">
          {finding.fixSuggestion}
        </pre>
      </div>
    </div>
  );
}
