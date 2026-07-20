import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GoblinVerdict as GoblinVerdictType } from "@/lib/types/deal";
import { cn } from "@/lib/utils";

interface GoblinVerdictProps {
  verdict: GoblinVerdictType;
}

const verdictStyles = {
  approved: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/5",
    title: "text-emerald-400",
    icon: CheckCircle2,
  },
  caution: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/5",
    title: "text-amber-400",
    icon: AlertTriangle,
  },
  reject: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/5",
    title: "text-rose-400",
    icon: XCircle,
  },
};

export function GoblinVerdict({ verdict }: GoblinVerdictProps) {
  const style = verdictStyles[verdict.type];
  const Icon = style.icon;

  return (
    <Card className={cn("border", style.border, style.bg)}>
      <CardHeader className="pb-3">
        <CardTitle
          className={cn("flex items-center gap-2 text-lg", style.title)}
        >
          <span className="text-xl" aria-hidden>
            {verdict.emoji}
          </span>
          <Icon className="size-5" aria-hidden />
          {verdict.label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {verdict.reasoning.map((reason, index) => (
            <li
              key={index}
              className="flex gap-2 text-sm text-muted-foreground"
            >
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-current opacity-60" />
              {reason}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
