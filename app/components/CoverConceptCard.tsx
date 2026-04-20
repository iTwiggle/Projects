"use client";

import type { CoverConcept, CoverTransformMode } from "@/app/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CoverConceptCardProps {
  concept: CoverConcept;
  isSelected: boolean;
  onSelect: (concept: CoverConcept) => void;
  onSave: (concept: CoverConcept) => void;
  onFavorite: (concept: CoverConcept) => void;
  onCopy: (concept: CoverConcept) => void;
  onTransform: (concept: CoverConcept, mode: CoverTransformMode) => void;
}

const ACTIONS: Array<{ label: string; mode: CoverTransformMode }> = [
  { label: "Recreate", mode: "recreate" },
  { label: "Reframe", mode: "reframe" },
  { label: "Redirect", mode: "redirect" },
  { label: "Make It Darker", mode: "darker" },
  { label: "Make It Simpler", mode: "simpler" },
  { label: "Make It More Surreal", mode: "surreal" },
  { label: "Make It More Nostalgic", mode: "nostalgic" },
  { label: "Fit Album Theme Better", mode: "fit-theme" },
];

export function CoverConceptCard({
  concept,
  isSelected,
  onSelect,
  onSave,
  onFavorite,
  onCopy,
  onTransform,
}: CoverConceptCardProps) {
  return (
    <Card
      className={`border transition-all ${isSelected ? "border-primary/80 ring-1 ring-primary/40" : "border-border/70"}`}
      onClick={() => onSelect(concept)}
    >
      <CardHeader>
        <CardTitle>{concept.title}</CardTitle>
        <CardDescription>{concept.composition}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-foreground">{concept.description}</p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Colors:</span> {concept.colors.join(", ")}
          </p>
          <p>
            <span className="font-medium text-foreground">Symbols:</span> {concept.symbols.join(", ")}
          </p>
          <p>
            <span className="font-medium text-foreground">Art prompt:</span> {concept.artPrompt}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {concept.moodTags.map((tag) => (
            <Badge key={`${concept.id}-${tag}`} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3">
        <div className="grid grid-cols-3 gap-2 md:grid-cols-4">
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onCopy(concept);
            }}
          >
            Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onSave(concept);
            }}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onFavorite(concept);
            }}
          >
            {concept.favorite ? "Unfavorite" : "Favorite"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onTransform(concept, "recreate");
            }}
          >
            Quick R
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <Button
              key={`${concept.id}-${action.mode}`}
              size="xs"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                onTransform(concept, action.mode);
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
