"use client";

import { useMemo } from "react";

import type { AlbumContext, GeneratorSettings, IdeaTransformMode, LyricIdea, SelectedCardState } from "@/app/types";
import { DEFAULT_MOODS, RHYME_SCHEMES, toKeywordList } from "@/app/lib/generator";
import { generateLyricIdeas, generateRawIdeaBurst } from "@/app/lib/lyricGenerator";
import { transformLyricIdea } from "@/app/lib/transforms";
import { LyricIdeaCard } from "@/app/components/LyricIdeaCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface LyricGeneratorPanelProps {
  settings: GeneratorSettings;
  onSettingsChange: (next: GeneratorSettings) => void;
  ideas: LyricIdea[];
  onIdeasChange: (next: LyricIdea[]) => void;
  albumContext: AlbumContext;
  selectedCard: SelectedCardState | null;
  onSelectCard: (next: SelectedCardState | null) => void;
  onSaveIdea: (idea: LyricIdea) => void;
  onCopyText: (value: string) => void;
}

const OUTPUT_TYPES = [
  "single lines",
  "couplets",
  "4-bar ideas",
  "punchlines",
  "hooks",
  "title ideas",
] as const;

const COMPLEXITY_OPTIONS = ["simple", "layered", "abstract", "direct"] as const;

export function LyricGeneratorPanel({
  settings,
  onSettingsChange,
  ideas,
  onIdeasChange,
  albumContext,
  selectedCard,
  onSelectCard,
  onSaveIdea,
  onCopyText,
}: LyricGeneratorPanelProps) {
  const keywordValue = useMemo(() => settings.keywords.join(", "), [settings.keywords]);

  const patchSettings = (patch: Partial<GeneratorSettings>) => {
    onSettingsChange({
      ...settings,
      ...patch,
    });
  };

  const runGenerate = () => {
    const next = generateLyricIdeas(
      {
        ...settings,
        variationSeed: settings.variationSeed + 1,
      },
      albumContext,
    );
    onIdeasChange(next);
    onSelectCard(next[0] ? { id: next[0].id, cardType: "lyric" } : null);
    patchSettings({ variationSeed: settings.variationSeed + 1 });
  };

  const runRawBurst = () => {
    const next = generateRawIdeaBurst(
      {
        ...settings,
        variationSeed: settings.variationSeed + 5,
      },
      albumContext,
    );
    onIdeasChange(next);
    onSelectCard(next[0] ? { id: next[0].id, cardType: "lyric" } : null);
    patchSettings({ variationSeed: settings.variationSeed + 5 });
  };

  const handleTransform = (idea: LyricIdea, mode: IdeaTransformMode) => {
    const output = transformLyricIdea(
      idea,
      mode,
      settings,
      albumContext,
      settings.variationSeed + ideas.length + 11,
    );
    const transformed = Array.isArray(output) ? output : [output];
    onIdeasChange([...transformed, ...ideas]);
    onSelectCard(transformed[0] ? { id: transformed[0].id, cardType: "lyric" } : null);
    patchSettings({ variationSeed: settings.variationSeed + 3 });
  };

  const quickModes: Array<{ label: string; mode: IdeaTransformMode }> = [
    { label: "Recreate", mode: "recreate" },
    { label: "Reframe", mode: "reframe" },
    { label: "Take It Darker", mode: "darker" },
    { label: "Take It Funnier", mode: "funnier" },
    { label: "Take It More Personal", mode: "personal" },
    { label: "Fit Album Theme Better", mode: "fit-theme" },
  ];

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur">
      <CardHeader>
        <CardTitle>Lyric Idea Generator</CardTitle>
        <CardDescription>
          Structured lyric cards with deterministic generation, transforms, and remix flow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-1 md:col-span-2">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Topic / Prompt</span>
            <Input
              id="main-topic-input"
              value={settings.topic}
              onChange={(event) => patchSettings({ topic: event.currentTarget.value })}
              placeholder="Growing up in the 90s but questioning who I became"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Mood</span>
            <Select
              value={settings.mood}
              onValueChange={(value) => patchSettings({ mood: value as GeneratorSettings["mood"] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_MOODS.map((mood) => (
                  <SelectItem key={mood} value={mood}>
                    {mood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Style / Cadence</span>
            <Input
              value={settings.styleCadence}
              onChange={(event) => patchSettings({ styleCadence: event.currentTarget.value })}
              placeholder="mid-tempo, rhythmic pivots, clean enjambment"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Keywords</span>
            <Input
              value={keywordValue}
              onChange={(event) => patchSettings({ keywords: toKeywordList(event.currentTarget.value) })}
              placeholder="CRT, checkerboard, bus stop, static"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Rhyme Scheme</span>
            <Select
              value={settings.rhymeScheme}
              onValueChange={(value) =>
                patchSettings({ rhymeScheme: value as GeneratorSettings["rhymeScheme"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RHYME_SCHEMES.map((scheme) => (
                  <SelectItem key={scheme} value={scheme}>
                    {scheme}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Output Type</span>
            <Select
              value={settings.outputType}
              onValueChange={(value) => patchSettings({ outputType: value as GeneratorSettings["outputType"] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OUTPUT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <label className="space-y-1">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Complexity</span>
            <Select
              value={settings.complexity}
              onValueChange={(value) =>
                patchSettings({ complexity: value as GeneratorSettings["complexity"] })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPLEXITY_OPTIONS.map((complexity) => (
                  <SelectItem key={complexity} value={complexity}>
                    {complexity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          <div className="flex items-end justify-between rounded-lg border border-border/70 p-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Use Album Context</p>
              <p className="text-xs text-muted-foreground">Inject premise, themes, motifs, and avoid rules.</p>
            </div>
            <Switch
              checked={settings.useAlbumContext}
              onCheckedChange={(checked) => patchSettings({ useAlbumContext: Boolean(checked) })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button id="generate-lyrics-button" onClick={runGenerate}>
            Generate
          </Button>
          <Button variant="secondary" onClick={runRawBurst}>
            Raw Idea Burst
          </Button>
          {quickModes.map((quickMode) => (
            <Button
              key={quickMode.mode}
              variant="ghost"
              onClick={() => {
                if (!ideas[0]) return;
                handleTransform(ideas[0], quickMode.mode);
              }}
            >
              {quickMode.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Tip:</span>
          <Badge variant="outline">Enter = Generate</Badge>
          <Badge variant="outline">Cmd/Ctrl+K = focus prompt</Badge>
          <Badge variant="outline">R = recreate selected</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {ideas.map((idea) => (
            <LyricIdeaCard
              key={idea.id}
              idea={idea}
              isSelected={selectedCard?.cardType === "lyric" && selectedCard.id === idea.id}
              onSelect={(selected) => onSelectCard({ id: selected.id, cardType: "lyric" })}
              onSave={onSaveIdea}
              onFavorite={(target) => {
                onIdeasChange(
                  ideas.map((entry) =>
                    entry.id === target.id ? { ...entry, favorite: !entry.favorite } : entry,
                  ),
                );
              }}
              onRemix={(target) => handleTransform(target, "redirect")}
              onTransform={handleTransform}
              onCopy={(target) => onCopyText(target.text)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
