import { Badge } from "@/components/ui/badge";
import type { ExtractionConfidence, FieldConfidence } from "@/lib/intake/listing-parser";
import { cn } from "@/lib/utils";

interface ExtractionConfidenceProps {
  confidence: ExtractionConfidence;
}

const confidenceStyles: Record<FieldConfidence, string> = {
  high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-rose-500/15 text-rose-400 border-rose-500/30",
};

const fieldLabels = {
  itemName: "Title",
  askingPrice: "Price",
  condition: "Condition",
  category: "Category",
} as const;

function ConfidencePill({
  label,
  level,
}: {
  label: string;
  level: FieldConfidence;
}) {
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium", confidenceStyles[level])}
    >
      {label}: {level}
    </Badge>
  );
}

export function ExtractionConfidenceBar({
  confidence,
}: ExtractionConfidenceProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">
        Extraction confidence
      </p>
      <div className="flex flex-wrap gap-1.5">
        <ConfidencePill label={fieldLabels.itemName} level={confidence.itemName} />
        <ConfidencePill label={fieldLabels.askingPrice} level={confidence.askingPrice} />
        <ConfidencePill label={fieldLabels.condition} level={confidence.condition} />
        <ConfidencePill label={fieldLabels.category} level={confidence.category} />
      </div>
    </div>
  );
}
