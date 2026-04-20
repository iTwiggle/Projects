"use client";

import type { IdeaTransformMode, LyricIdea } from "@/app/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface LyricIdeaCardProps {
  idea: LyricIdea;
  isSelected: boolean;
  onSelect: (idea: LyricIdea) => void;
  onSave: (idea: LyricIdea) => void;
  onFavorite: (idea: LyricIdea) => void;
  onRemix: (idea: LyricIdea) => void;
  onTransform: (idea: LyricIdea, mode: IdeaTransformMode) => void;
  onCopy: (idea: LyricIdea) => void;
}

const TRANSFORM_BUTTONS: Array<{ label: string; mode: IdeaTransformMode }> = [
  { label: "Recreate", mode: "recreate" },
  { label: "Reframe", mode: "reframe" },
  { label: "Redirect", mode: "redirect" },
  { label: "Take It Darker", mode: "darker" },
  { label: "Take It Funnier", mode: "funnier" },
  { label: "Take It More Personal", mode: "personal" },
  { label: "Fit Album Theme Better", mode: "fit-theme" },
  { label: "Extrapolate Theme", mode: "extrapolate" },
];

export function LyricIdeaCard({
  idea,
  isSelected,
  onSelect,
  onSave,
  onFavorite,
  onRemix,
  onTransform,
  onCopy,
}: LyricIdeaCardProps) {
  return (
    <Card
      className={`border transition-all ${isSelected ? "border-primary/80 ring-1 ring-primary/40" : "border-border/70"}`}
      onClick={() => onSelect(idea)}
    >
      <CardHeader>
        <CardTitle className="text-sm">{idea.directionLabel}</CardTitle>
        <CardDescription>{idea.explanation}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{idea.text}</pre>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{idea.type}</Badge>
          <Badge variant="secondary">{idea.mood}</Badge>
          {idea.rhymeLabel ? <Badge variant="secondary">{idea.rhymeLabel}</Badge> : null}
          {idea.tags.slice(0, 4).map((tag) => (
            <Badge key={`${idea.id}-${tag}`} variant="outline">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-3">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onCopy(idea);
            }}
          >
            Copy
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onSave(idea);
            }}
          >
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onFavorite(idea);
            }}
          >
            {idea.favorite ? "Unfavorite" : "Favorite"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onRemix(idea);
            }}
          >
            Remix
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={(event) => {
              event.stopPropagation();
              onTransform(idea, "recreate");
            }}
          >
            Quick R
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {TRANSFORM_BUTTONS.map((transform) => (
            <Button
              key={`${idea.id}-${transform.mode}`}
              size="xs"
              variant="ghost"
              onClick={(event) => {
                event.stopPropagation();
                onTransform(idea, transform.mode);
              }}
            >
              {transform.label}
            </Button>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}
