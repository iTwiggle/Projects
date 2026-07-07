"use client";

import { useMemo } from "react";

import type {
  AlbumContext,
  CoverConcept,
  CoverGeneratorSettings,
  CoverTransformMode,
  SelectedCardState,
} from "@/app/types";
import { generateCoverConcepts } from "@/app/lib/coverConceptGenerator";
import { splitList } from "@/app/lib/generator";
import { transformCoverConcept } from "@/app/lib/transforms";
import { CoverConceptCard } from "@/app/components/CoverConceptCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface CoverArtGeneratorPanelProps {
  settings: CoverGeneratorSettings;
  onSettingsChange: (next: CoverGeneratorSettings) => void;
  concepts: CoverConcept[];
  onConceptsChange: (next: CoverConcept[]) => void;
  albumContext: AlbumContext;
  selectedCard: SelectedCardState | null;
  onSelectCard: (next: SelectedCardState | null) => void;
  onSaveConcept: (concept: CoverConcept) => void;
  onCopyText: (value: string) => void;
}

const MOOD_OPTIONS = [
  "nostalgic",
  "reflective",
  "aggressive",
  "playful",
  "melancholic",
  "triumphant",
  "cinematic",
  "surreal",
] as const;

const QUICK_MODES: Array<{ label: string; mode: CoverTransformMode }> = [
  { label: "Recreate", mode: "recreate" },
  { label: "Make It Darker", mode: "darker" },
  { label: "Make It Simpler", mode: "simpler" },
  { label: "Make It More Surreal", mode: "surreal" },
  { label: "Make It More Nostalgic", mode: "nostalgic" },
  { label: "Fit Album Theme Better", mode: "fit-theme" },
];

export function CoverArtGeneratorPanel({
  settings,
  onSettingsChange,
  concepts,
  onConceptsChange,
  albumContext,
  selectedCard,
  onSelectCard,
  onSaveConcept,
  onCopyText,
}: CoverArtGeneratorPanelProps) {
  const motifsValue = useMemo(() => settings.visualMotifs.join(", "), [settings.visualMotifs]);

  const patchSettings = (patch: Partial<CoverGeneratorSettings>) => {
    onSettingsChange({
      ...settings,
      ...patch,
    });
  };

  const runGenerate = () => {
    const next = generateCoverConcepts(
      {
        ...settings,
        variationSeed: settings.variationSeed + 1,
      },
      albumContext,
    );
    onConceptsChange(next);
    onSelectCard(next[0] ? { id: next[0].id, cardType: "cover" } : null);
    patchSettings({ variationSeed: settings.variationSeed + 1 });
  };

  const transform = (concept: CoverConcept, mode: CoverTransformMode) => {
    const next = transformCoverConcept(
      concept,
      mode,
      settings,
      albumContext,
      settings.variationSeed + concepts.length + 40,
    );
    onConceptsChange([next, ...concepts]);
    onSelectCard({ id: next.id, cardType: "cover" });
    patchSettings({ variationSeed: settings.variationSeed + 3 });
  };

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur">
      <CardHeader>
        <CardTitle>Cover Art Concept Generator</CardTitle>
        <CardDescription>
          Generates visual concept cards and image-generator-ready prompts (no image rendering in MVP).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Album / Project Name</span>
            <Input
              value={settings.albumName}
              onChange={(event) => patchSettings({ albumName: event.currentTarget.value })}
              placeholder="Checkered Past"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Theme</span>
            <Input
              value={settings.theme}
              onChange={(event) => patchSettings({ theme: event.currentTarget.value })}
              placeholder="memory fragments + suburban irony"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Mood</span>
            <Select
              value={settings.mood}
              onValueChange={(value) => patchSettings({ mood: value as CoverGeneratorSettings["mood"] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOOD_OPTIONS.map((mood) => (
                  <SelectItem key={mood} value={mood}>
                    {mood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Visual Motifs</span>
            <Input
              value={motifsValue}
              onChange={(event) => patchSettings({ visualMotifs: splitList(event.currentTarget.value) })}
              placeholder="CRT glow, checkerboard, bedroom ceiling fan"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Color Palette</span>
            <Input
              value={settings.colorPalette}
              onChange={(event) => patchSettings({ colorPalette: event.currentTarget.value })}
              placeholder="phosphor green, washed peach, smoke black"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Era / Reference Points</span>
            <Input
              value={settings.references}
              onChange={(event) => patchSettings({ references: event.currentTarget.value })}
              placeholder="90s ad textures, disposable camera blur"
            />
          </label>
          <div className="flex items-end justify-between rounded-lg border border-border/70 p-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Use Album Context</p>
              <p className="text-xs text-muted-foreground">Blend saved themes and motifs into concepts.</p>
            </div>
            <Switch
              checked={settings.useAlbumContext}
              onCheckedChange={(checked) => patchSettings({ useAlbumContext: Boolean(checked) })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={runGenerate}>Generate Cover Concepts</Button>
          {QUICK_MODES.map((quick) => (
            <Button
              key={quick.mode}
              variant="ghost"
              onClick={() => {
                if (!concepts[0]) return;
                transform(concepts[0], quick.mode);
              }}
            >
              {quick.label}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {concepts.map((concept) => (
            <CoverConceptCard
              key={concept.id}
              concept={concept}
              isSelected={selectedCard?.cardType === "cover" && selectedCard.id === concept.id}
              onSelect={(selected) => onSelectCard({ id: selected.id, cardType: "cover" })}
              onSave={onSaveConcept}
              onFavorite={(target) => {
                onConceptsChange(
                  concepts.map((entry) =>
                    entry.id === target.id ? { ...entry, favorite: !entry.favorite } : entry,
                  ),
                );
              }}
              onCopy={(target) => onCopyText(`${target.title}\n\n${target.description}\n\n${target.artPrompt}`)}
              onTransform={transform}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
