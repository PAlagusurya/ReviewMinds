interface ScoreBadgeProps {
  score: number | null;
  size?: "sm" | "lg";
}

export function ScoreBadge({ score, size = "sm" }: ScoreBadgeProps) {
  if (score === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
        pending
      </span>
    );
  }

  const color =
    score >= 80
      ? "bg-green-100 text-green-800"
      : score >= 60
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800";

  const textSize =
    size === "lg" ? "text-2xl font-bold px-4 py-1" : "text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 ${color} ${textSize}`}
    >
      {score}/100
    </span>
  );
}
