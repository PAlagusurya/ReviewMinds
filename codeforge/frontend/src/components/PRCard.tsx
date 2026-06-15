"use client";

import Link from "next/link";
import { PRSummary } from "@/types/api";
import { ScoreBadge } from "./ScoreBadge";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  analyzing: "bg-blue-100 text-blue-700",
  complete: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export function PRCard({ pr }: { pr: PRSummary }) {
  return (
    <Link href={`/pr/${pr.prNumber}`}>
      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-gray-900">{pr.title}</p>
            <p className="mt-1 text-sm text-gray-500">
              PR #{pr.prNumber} · by {pr.authorUsername}
            </p>
          </div>
          <ScoreBadge score={pr.latestAnalysis?.qualityScore ?? null} />
        </div>

        <div className="mt-3 flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[pr.status] ?? STATUS_COLOR.pending}`}
          >
            {pr.status}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(pr.latestAnalysis?.createdAt).toLocaleDateString()}
          </span>
          {pr.history.length > 0 && (
            <span className="text-xs text-gray-400">
              · {pr.history.length + 1} analyses
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
