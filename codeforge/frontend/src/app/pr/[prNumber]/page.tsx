"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { usePR, useFindings } from "@/hooks/use-prs";
import { Finding, AnalysisItem } from "@/types/api";

const SEVERITY_ORDER = ["high", "medium", "low", "info"];

const SEV = {
  high: {
    dot: "#ef4444",
    text: "#ef4444",
    bg: "#450a0a22",
    border: "#450a0a55",
  },
  medium: {
    dot: "#f59e0b",
    text: "#f59e0b",
    bg: "#451a0322",
    border: "#451a0355",
  },
  low: {
    dot: "#60a5fa",
    text: "#60a5fa",
    bg: "#1e3a5f22",
    border: "#1e3a5f55",
  },
  info: {
    dot: "#71717a",
    text: "#71717a",
    bg: "#27272a22",
    border: "#27272a55",
  },
};

const WORKER: Record<string, string> = {
  security: "Security",
  complexity: "Complexity",
  "test-gaps": "Test Gaps",
  breaking: "Breaking",
};

function FindingCard({ finding }: { finding: Finding }) {
  const s = SEV[finding.severity as keyof typeof SEV] ?? SEV.info;
  return (
    <div
      style={{
        border: `1px solid ${s.border}`,
        background: s.bg,
        borderRadius: 7,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: s.dot,
              display: "inline-block",
            }}
          />
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: s.text,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            {finding.severity}
          </span>
        </span>
        <span style={{ fontSize: 10, color: "#71717a" }}>
          {finding.category}
        </span>
        <span style={{ fontSize: 10, color: "#52525b" }}>
          {WORKER[finding.workerType] ?? finding.workerType}
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontFamily: "var(--font-mono)",
            fontSize: 10,
            color: "#52525b",
          }}
        >
          {finding.filePath}:{finding.lineNumber}
        </span>
      </div>

      <p
        style={{
          marginTop: 10,
          fontSize: 12,
          color: "#a1a1aa",
          lineHeight: 1.6,
        }}
      >
        {finding.explanation}
      </p>

      <div
        style={{
          marginTop: 10,
          borderRadius: 6,
          background: "#0a0a0a",
          border: "1px solid #1e1e1e",
          padding: "10px 12px",
        }}
      >
        <p
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#52525b",
            marginBottom: 6,
          }}
        >
          Suggested fix
        </p>
        <pre
          style={{
            fontSize: 11,
            color: "#a1a1aa",
            whiteSpace: "pre-wrap",
            lineHeight: 1.6,
            overflow: "auto",
            margin: 0,
            fontFamily: "var(--font-mono)",
          }}
        >
          {finding.fixSuggestion}
        </pre>
      </div>
    </div>
  );
}

export default function PRDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const prNumber = params.prNumber as string;

  const { data: pr, isLoading: prLoading } = usePR(Number(prNumber));
  const selectedAnalysisId =
    searchParams.get("analysisId") ?? pr?.analyses?.[0]?.id;
  const { data: findings = [], isLoading: findingsLoading } =
    useFindings(selectedAnalysisId);

  const allAnalyses: AnalysisItem[] = pr?.analyses ?? [];
  const selectedAnalysis =
    allAnalyses.find((a) => a.id === selectedAnalysisId) ?? allAnalyses[0];

  const grouped = SEVERITY_ORDER.reduce<Record<string, Finding[]>>((acc, s) => {
    acc[s] = findings.filter((f: Finding) => f.severity === s);
    return acc;
  }, {});

  const score = selectedAnalysis?.qualityScore ?? null;
  const scoreColor =
    score === null
      ? "#52525b"
      : score >= 80
        ? "#22c55e"
        : score >= 50
          ? "#f59e0b"
          : "#ef4444";

  if (prLoading || findingsLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            width: "100%",
            maxWidth: 700,
            padding: "0 24px",
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                height: 48,
                borderRadius: 6,
                background: "#141414",
                animation: "pulse 1.5s infinite",
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!pr) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0d0d0d",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#52525b", fontSize: 13 }}>PR not found</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#e4e4e7",
        fontFamily: "var(--font-sans)",
      }}
    >
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}} .commit-row:hover{background:#1a1a1a !important}`}</style>

      {/* nav */}
      <div
        style={{
          borderBottom: "1px solid #1e1e1e",
          padding: "0 20px",
          height: 44,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 20,
              height: 20,
              background: "#fff",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 18 18" fill="none">
              <path
                d="M3 5h12M3 9h8M3 13h10"
                stroke="#09090b"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="14" cy="13" r="2.5" fill="#22c55e" />
            </svg>
          </div>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#e4e4e7",
              letterSpacing: "-0.01em",
            }}
          >
            ReviewMind
          </span>
        </div>
        <span style={{ color: "#333" }}>/</span>
        <Link
          href="/dashboard"
          style={{ fontSize: 12, color: "#71717a", textDecoration: "none" }}
        >
          Dashboard
        </Link>
        <span style={{ color: "#333" }}>/</span>
        <span style={{ fontSize: 12, color: "#a1a1aa" }}>
          PR #{pr.prNumber}
        </span>
      </div>

      <div style={{ display: "flex" }}>
        {/* sidebar */}
        <div
          style={{
            width: 200,
            borderRight: "1px solid #1e1e1e",
            padding: "12px 8px",
            flexShrink: 0,
            minHeight: "calc(100vh - 44px)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#52525b",
              padding: "0 8px",
              marginBottom: 4,
            }}
          >
            Details
          </div>
          <div style={{ padding: "6px 8px" }}>
            <div style={{ fontSize: 9, color: "#52525b", marginBottom: 2 }}>
              Author
            </div>
            <div style={{ fontSize: 11, color: "#a1a1aa" }}>
              {pr.authorUsername}
            </div>
          </div>
          <div style={{ padding: "6px 8px" }}>
            <div style={{ fontSize: 9, color: "#52525b", marginBottom: 2 }}>
              Score
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: scoreColor,
              }}
            >
              {score ?? "—"}
              {score !== null && (
                <span style={{ fontSize: 10, color: "#52525b" }}>/100</span>
              )}
            </div>
          </div>
          <div style={{ padding: "6px 8px" }}>
            <div style={{ fontSize: 9, color: "#52525b", marginBottom: 6 }}>
              Findings
            </div>
            {SEVERITY_ORDER.map(
              (s) =>
                grouped[s]?.length > 0 && (
                  <div
                    key={s}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        color: SEV[s as keyof typeof SEV].text,
                      }}
                    >
                      {s}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        color: SEV[s as keyof typeof SEV].text,
                      }}
                    >
                      {grouped[s].length}
                    </span>
                  </div>
                ),
            )}
            {findings.length === 0 && (
              <div style={{ fontSize: 10, color: "#52525b" }}>none</div>
            )}
          </div>
        </div>

        {/* main */}
        <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
          {/* PR title */}
          <h1
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#e4e4e7",
              margin: "0 0 4px",
            }}
          >
            {pr.title}
          </h1>
          <p style={{ fontSize: 11, color: "#52525b", marginBottom: 20 }}>
            PR #{pr.prNumber} · {pr.authorUsername} · {findings.length} findings
          </p>

          {/* analysis history */}
          {allAnalyses.length > 1 && (
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "#52525b",
                  marginBottom: 8,
                }}
              >
                Analysis history · {allAnalyses.length} commits
              </div>
              <div
                style={{
                  border: "1px solid #1e1e1e",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                {allAnalyses.map((analysis, index) => {
                  const isSelected = analysis.id === selectedAnalysisId;
                  const isLatest = index === 0;
                  const sc = analysis.qualityScore;
                  const scColor =
                    sc === null
                      ? "#52525b"
                      : sc >= 80
                        ? "#22c55e"
                        : sc >= 50
                          ? "#f59e0b"
                          : "#ef4444";
                  return (
                    <div
                      key={analysis.id}
                      className="commit-row"
                      onClick={() =>
                        router.push(`/pr/${prNumber}?analysisId=${analysis.id}`)
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "9px 14px",
                        cursor: "pointer",
                        background: isSelected ? "#1a1a1a" : "transparent",
                        borderBottom:
                          index < allAnalyses.length - 1
                            ? "1px solid #141414"
                            : "none",
                        transition: "background 0.1s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: 11,
                            color: isSelected ? "#d4d4d8" : "#71717a",
                          }}
                        >
                          {analysis.headSha.slice(0, 7)}
                        </span>
                        <span style={{ fontSize: 10, color: "#52525b" }}>
                          {new Date(analysis.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            },
                          )}
                        </span>
                        {isLatest && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: "1px 6px",
                              background: "#14532d22",
                              color: "#22c55e",
                              borderRadius: 3,
                              fontWeight: 500,
                            }}
                          >
                            latest
                          </span>
                        )}
                        {isSelected && (
                          <span
                            style={{
                              fontSize: 9,
                              padding: "1px 6px",
                              background: "#1e3a5f33",
                              color: "#60a5fa",
                              borderRadius: 3,
                              fontWeight: 500,
                            }}
                          >
                            viewing
                          </span>
                        )}
                      </div>
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          fontWeight: 600,
                          color: scColor,
                        }}
                      >
                        {sc ?? "—"}/100
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* findings */}
          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#52525b",
              marginBottom: 12,
            }}
          >
            Findings
            {allAnalyses.length > 1 && selectedAnalysis && (
              <span
                style={{
                  marginLeft: 8,
                  fontFamily: "var(--font-mono)",
                  color: "#3f3f46",
                  fontWeight: 400,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                · {selectedAnalysis.headSha.slice(0, 7)}
              </span>
            )}
          </div>

          {findings.length === 0 ? (
            <div
              style={{
                border: "1px dashed #27272a",
                borderRadius: 8,
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 13, color: "#22c55e", fontWeight: 500 }}>
                No issues found
              </p>
              <p style={{ fontSize: 11, color: "#52525b", marginTop: 4 }}>
                This commit looks clean
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {SEVERITY_ORDER.filter((s) => grouped[s]?.length > 0).map(
                (severity) => (
                  <div key={severity}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: SEV[severity as keyof typeof SEV].dot,
                          display: "inline-block",
                        }}
                      />
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: SEV[severity as keyof typeof SEV].text,
                          textTransform: "uppercase",
                          letterSpacing: "0.06em",
                        }}
                      >
                        {severity} · {grouped[severity].length}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      {grouped[severity].map((finding) => (
                        <FindingCard key={finding.id} finding={finding} />
                      ))}
                    </div>
                  </div>
                ),
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
