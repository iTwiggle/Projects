import { Badge } from "@/components/ui/badge";
import type { ExtractionConfidence, FieldConfidence } from "@/lib/intake/listing-parser";
import {
  INTAKE_SOURCE_LABELS,
  type IntakeExtractionSource,
} from "@/lib/types/intake-source";
import { cn } from "@/lib/utils";

interface ExtractionConfidenceProps {
  confidence: ExtractionConfidence;
  source?: IntakeExtractionSource;
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

const sourceStyles: Record<IntakeExtractionSource, string> = {
  url_autofill: "bg-violet-500/15 text-violet-400 border-violet-500/30",
  ocr: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  manual: "bg-muted text-muted-foreground border-border/60",
};

export function ExtractionConfidenceBar({
  confidence,
  source,
}: ExtractionConfidenceProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Extraction confidence
        </p>
        {source && (
          <Badge
            variant="outline"
            className={cn("text-[10px]", sourceStyles[source])}
          >
            {INTAKE_SOURCE_LABELS[source]}
          </Badge>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <ConfidencePill label={fieldLabels.itemName} level={confidence.itemName} />
        <ConfidencePill label={fieldLabels.askingPrice} level={confidence.askingPrice} />
        <ConfidencePill label={fieldLabels.condition} level={confidence.condition} />
        <ConfidencePill label={fieldLabels.category} level={confidence.category} />
      </div>
    </div>
  );
}
