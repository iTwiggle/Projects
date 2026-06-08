import { AlertTriangle } from "lucide-react";

interface DealEstimateWarningsProps {
  warnings: string[];
}

export function DealEstimateWarnings({ warnings }: DealEstimateWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {warnings.map((warning) => (
        <div
          key={warning}
          className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-amber-400"
            aria-hidden
          />
          <p className="text-xs text-muted-foreground">{warning}</p>
        </div>
      ))}
    </div>
  );
}
