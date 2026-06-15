"use client";

import { usePRs } from "@/hooks/use-prs";
import { PRSummary } from "@/types/api";
import Link from "next/link";

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null)
    return (
      <span
        style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#888" }}
      >
        —
      </span>
    );
  const color = score >= 80 ? "#22c55e" : score >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        fontWeight: 600,
        color,
      }}
    >
      {score}/100
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    complete: { bg: "#14532d22", color: "#22c55e", label: "complete" },
    analyzing: { bg: "#1e3a5f22", color: "#60a5fa", label: "analyzing" },
    pending: { bg: "#27272a", color: "#71717a", label: "pending" },
    failed: { bg: "#450a0a22", color: "#ef4444", label: "failed" },
  };
  const s = styles[status] ?? styles.pending;
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        fontSize: 10,
        fontWeight: 500,
        padding: "2px 7px",
        borderRadius: 4,
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {status === "analyzing" && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: s.color,
            display: "inline-block",
            animation: "pulse 1.5s infinite",
          }}
        />
      )}
      {s.label}
    </span>
  );
}

export default function DashboardPage() {
  const { data: prs, isLoading, isError } = usePRs();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#e4e4e7",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .pr-row:hover { background: #1a1a1a !important; }
        .nav-link:hover { background: #1a1a1a !important; color: #e4e4e7 !important; }
      `}</style>

      {/* top nav */}
      <div
        style={{
          borderBottom: "1px solid #1e1e1e",
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          gap: 8,
          height: 44,
          flexShrink: 0,
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
        <span style={{ color: "#333", fontSize: 13 }}>/</span>
        <span style={{ fontSize: 12, color: "#71717a" }}>Dashboard</span>
      </div>

      {/* layout */}
      <div style={{ display: "flex", flex: 1 }}>
        {/* sidebar */}
        <div
          style={{
            width: 200,
            borderRight: "1px solid #1e1e1e",
            padding: "12px 8px",
            flexShrink: 0,
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
            Workspace
          </div>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <div
              className="nav-link"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 8px",
                borderRadius: 5,
                fontSize: 12,
                color: "#e4e4e7",
                background: "#1a1a1a",
                cursor: "pointer",
                marginBottom: 1,
              }}
            >
              <i
                className="ti ti-git-pull-request"
                aria-hidden="true"
                style={{ fontSize: 14 }}
              />
              Pull Requests
            </div>
          </Link>
          <div
            className="nav-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 8px",
              borderRadius: 5,
              fontSize: 12,
              color: "#52525b",
              cursor: "pointer",
              marginBottom: 1,
            }}
          >
            <i
              className="ti ti-chart-bar"
              aria-hidden="true"
              style={{ fontSize: 14 }}
            />
            Analytics
          </div>

          <div
            style={{
              fontSize: 9,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "#52525b",
              padding: "8px 8px 4px",
            }}
          >
            Repos
          </div>
          <div
            className="nav-link"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "6px 8px",
              borderRadius: 5,
              fontSize: 12,
              color: "#52525b",
              cursor: "pointer",
            }}
          >
            <i
              className="ti ti-brand-github"
              aria-hidden="true"
              style={{ fontSize: 14 }}
            />
            codeforge-test
          </div>
        </div>

        {/* main content */}
        <div style={{ flex: 1, padding: "20px 24px", overflow: "auto" }}>
          {/* page header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 20,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: "#e4e4e7",
                  margin: 0,
                }}
              >
                Pull Requests
              </h1>
              <p style={{ fontSize: 11, color: "#52525b", marginTop: 2 }}>
                AI analysis runs automatically on every PR
              </p>
            </div>
            <span style={{ fontSize: 11, color: "#3f3f46" }}>
              {prs?.length ?? 0} PRs
            </span>
          </div>

          {/* loading */}
          {isLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
          )}

          {/* error */}
          {isError && !isLoading && (
            <div
              style={{
                border: "1px solid #450a0a55",
                background: "#450a0a22",
                borderRadius: 8,
                padding: "14px 16px",
              }}
            >
              <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 500 }}>
                Cannot reach backend
              </p>
              <p style={{ fontSize: 11, color: "#7f1d1d", marginTop: 4 }}>
                Make sure Anvil is running on port 3333
              </p>
            </div>
          )}

          {/* empty */}
          {!isLoading && !isError && !prs?.length && (
            <div
              style={{
                border: "1px dashed #27272a",
                borderRadius: 8,
                padding: "48px 24px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 13, color: "#52525b" }}>
                No PRs analyzed yet
              </p>
              <p style={{ fontSize: 11, color: "#3f3f46", marginTop: 4 }}>
                Open a PR on your connected repo to get started
              </p>
            </div>
          )}

          {/* table */}
          {!isLoading && !isError && prs?.length > 0 && (
            <div
              style={{
                border: "1px solid #1e1e1e",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              {/* table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 90px 80px",
                  gap: 8,
                  padding: "8px 14px",
                  borderBottom: "1px solid #1e1e1e",
                }}
              >
                {["Pull request", "Status", "Score"].map((h, i) => (
                  <div
                    key={h}
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      color: "#52525b",
                      textAlign: i === 2 ? "right" : "left",
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* rows */}
              {prs.map((pr: PRSummary, idx: number) => (
                <Link
                  key={pr.prNumber}
                  href={`/pr/${pr.prNumber}`}
                  style={{ textDecoration: "none" }}
                >
                  <div
                    className="pr-row"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 90px 80px",
                      gap: 8,
                      padding: "10px 14px",
                      alignItems: "center",
                      cursor: "pointer",
                      borderBottom:
                        idx < prs.length - 1 ? "1px solid #141414" : "none",
                      transition: "background 0.1s",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#d4d4d8",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {pr.title}
                      </div>
                      <div
                        style={{ fontSize: 10, color: "#52525b", marginTop: 2 }}
                      >
                        PR #{pr.prNumber} · {pr.authorUsername} ·{" "}
                        {new Date(
                          pr.latestAnalysis?.createdAt,
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {pr.history.length > 0 &&
                          ` · ${pr.history.length + 1} analyses`}
                      </div>
                    </div>
                    <div>
                      <StatusBadge status={pr.status} />
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <ScoreBadge
                        score={pr.latestAnalysis?.qualityScore ?? null}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
