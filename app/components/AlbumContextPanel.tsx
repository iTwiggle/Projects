"use client";

import type { AlbumContext } from "@/app/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface AlbumContextPanelProps {
  context: AlbumContext;
  onChange: (next: AlbumContext) => void;
}

interface FieldConfig {
  key: keyof AlbumContext;
  label: string;
  placeholder: string;
  multiline?: boolean;
}

const FIELD_CONFIG: FieldConfig[] = [
  { key: "title", label: "Album title", placeholder: "Checkered Past" },
  {
    key: "premise",
    label: "Album premise",
    placeholder:
      "Growing up in the 90s, cartoon memory fragments, middle-class America, irony + sincerity.",
    multiline: true,
  },
  {
    key: "themes",
    label: "Core themes",
    placeholder: "nostalgia, identity, awkwardness, humor, alienation, masculinity, memory",
    multiline: true,
  },
  { key: "tone", label: "Tone / mood", placeholder: "sincere, witty, memory-driven" },
  { key: "references", label: "Era / nostalgia references", placeholder: "Cartoon Network, VHS ads, 90s suburbs" },
  {
    key: "visualMotifs",
    label: "Visual motifs",
    placeholder: "CRT glow, checkerboard, suburban bedrooms, VHS grain",
    multiline: true,
  },
  { key: "keywords", label: "Keywords", placeholder: "rewind, static, sidewalks, bus stop" },
  {
    key: "avoid",
    label: "Things to avoid",
    placeholder: "generic trap cliches, fake gang talk, over-serious fake depth",
    multiline: true,
  },
  {
    key: "styleNotes",
    label: "Writing style notes",
    placeholder: "conversational lines, punchline pivots, visual detail before thesis",
    multiline: true,
  },
];

export function AlbumContextPanel({ context, onChange }: AlbumContextPanelProps) {
  const updateField = (field: keyof AlbumContext, value: string) => {
    onChange({
      ...context,
      [field]: value,
    });
  };

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur">
      <CardHeader>
        <CardTitle>Project / Album Context</CardTitle>
        <CardDescription>
          Persistent context that every generator can pull from for tighter thematic output.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FIELD_CONFIG.map((field) => (
            <label key={field.key} className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {field.label}
              </span>
              {field.multiline ? (
                <Textarea
                  value={context[field.key]}
                  onChange={(event) => updateField(field.key, event.currentTarget.value)}
                  placeholder={field.placeholder}
                  className="min-h-20"
                />
              ) : (
                <Input
                  value={context[field.key]}
                  onChange={(event) => updateField(field.key, event.currentTarget.value)}
                  placeholder={field.placeholder}
                />
              )}
            </label>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
