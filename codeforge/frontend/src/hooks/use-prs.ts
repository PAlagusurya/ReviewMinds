import { useQuery } from "@tanstack/react-query";
import { fetchPRs, fetchPRByNumber, fetchFindings } from "@/lib/api";

export function usePRs() {
  return useQuery({
    queryKey: ["prs"],
    queryFn: fetchPRs,
  });
}

export function usePR(prNumber: number) {
  return useQuery({
    queryKey: ["prs", prNumber],
    queryFn: () => fetchPRByNumber(prNumber),
    enabled: !!prNumber,
  });
}

export function useFindings(analysisId: string | undefined) {
  return useQuery({
    queryKey: ["findings", analysisId],
    queryFn: () => fetchFindings(analysisId!),
    enabled: !!analysisId,
  });
}
