const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3333";

export async function fetchPRs() {
  const res = await fetch(`${BACKEND_URL}/prs`);
  if (!res.ok) throw new Error("Failed to fetch PRs");
  const json = await res.json();
  return json.data;
}

export async function fetchPRByNumber(prNumber: number) {
  const res = await fetch(`${BACKEND_URL}/prs/${prNumber}`);
  if (!res.ok) throw new Error(`PR #${prNumber} not found`);
  const json = await res.json();
  return json.data;
}

export async function fetchFindings(analysisId: string) {
  const res = await fetch(`${BACKEND_URL}/prs/analyses/${analysisId}/findings`);
  if (!res.ok) throw new Error("Failed to fetch findings");
  const json = await res.json();
  return json.data;
}
