"use client";

import { Sparkles, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { IdeaInput } from "@/types/concept";

interface IdeaInputPanelProps {
  value: IdeaInput;
  onChange: (field: keyof IdeaInput, nextValue: string) => void;
  onGenerate: () => void;
}

const shortFields: Array<{ key: keyof IdeaInput; label: string; placeholder: string }> = [
  {
    key: "interests",
    label: "Interests",
    placeholder: "poker, fitness, music production",
  },
  {
    key: "industries",
    label: "Industries",
    placeholder: "cybersecurity, creator tools, workflow software",
  },
  {
    key: "hobbies",
    label: "Hobbies",
    placeholder: "live looping, tattoo design, endurance sports",
  },
  {
    key: "skills",
    label: "Skills",
    placeholder: "product design, scripting, growth loops",
  },
];

const longFields: Array<{ key: keyof IdeaInput; label: string; placeholder: string }> = [
  {
    key: "frustrations",
    label: "Frustrations",
    placeholder:
      "What repeatedly feels broken, expensive, slow, or painful for this audience?",
  },
  {
    key: "technologies",
    label: "Technologies",
    placeholder: "AI agents, browser automation, computer vision, realtime collaboration",
  },
  {
    key: "randomConcepts",
    label: "Random Concepts",
    placeholder: "ADHD, behavioral psychology, anomaly detection, gamified accountability",
  },
];

export function IdeaInputPanel({ value, onChange, onGenerate }: IdeaInputPanelProps) {
  return (
    <Card className="border-cyan-300/20 bg-card/70 shadow-[0_0_40px_-24px_rgba(45,212,191,0.95)] backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-100">
          <Sparkles className="h-5 w-5 text-cyan-300" />
          Idea Input Engine
        </CardTitle>
        <CardDescription className="text-zinc-300">
          Feed Concept Forge with fragmented insights, then synthesize high-potential software
          concepts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          {shortFields.map((field) => (
            <label key={field.key} className="space-y-2">
              <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
                {field.label}
              </span>
              <Input
                value={value[field.key]}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={field.placeholder}
                className="border-zinc-700/70 bg-zinc-950/60 text-zinc-100 placeholder:text-zinc-500"
              />
            </label>
          ))}
        </div>

        <div className="grid gap-3">
          {longFields.map((field) => (
            <label key={field.key} className="space-y-2">
              <span className="text-xs font-medium tracking-wide text-zinc-400 uppercase">
                {field.label}
              </span>
              <Textarea
                value={value[field.key]}
                onChange={(event) => onChange(field.key, event.target.value)}
                placeholder={field.placeholder}
                rows={2}
                className="resize-none border-zinc-700/70 bg-zinc-950/60 text-zinc-100 placeholder:text-zinc-500"
              />
            </label>
          ))}
        </div>

        <Button
          onClick={onGenerate}
          className="w-full border border-cyan-300/40 bg-cyan-300/15 text-cyan-50 hover:bg-cyan-300/30"
        >
          <WandSparkles className="mr-2 h-4 w-4" />
          Generate Concept Batch
        </Button>
      </CardContent>
    </Card>
  );
}
