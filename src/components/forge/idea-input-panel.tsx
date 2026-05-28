"use client";

import { motion } from "framer-motion";
import { Flame, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ConceptInput } from "@/types/concept";
import { GlassCard } from "./glass-card";
import { TagInput } from "./tag-input";

interface IdeaInputPanelProps {
  inputs: ConceptInput;
  onChange: (patch: Partial<ConceptInput>) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

const INPUT_FIELDS: {
  key: keyof ConceptInput;
  label: string;
  placeholder: string;
  accent: "cyan" | "violet" | "amber" | "rose";
}[] = [
  {
    key: "interests",
    label: "Interests",
    placeholder: "poker, music production, ADHD…",
    accent: "cyan",
  },
  {
    key: "industries",
    label: "Industries",
    placeholder: "fitness, cybersecurity, education…",
    accent: "violet",
  },
  {
    key: "frustrations",
    label: "Frustrations",
    placeholder: "scattered tools, slow feedback loops…",
    accent: "rose",
  },
  {
    key: "hobbies",
    label: "Hobbies",
    placeholder: "live looping, tattoo design, hiking…",
    accent: "amber",
  },
  {
    key: "technologies",
    label: "Technologies",
    placeholder: "WebRTC, local-first, LLMs…",
    accent: "cyan",
  },
  {
    key: "skills",
    label: "Skills",
    placeholder: "React, sales, audio engineering…",
    accent: "violet",
  },
  {
    key: "randomConcepts",
    label: "Random Sparks",
    placeholder: "habit tracking, automation, marketplaces…",
    accent: "amber",
  },
];

const QUICK_SEEDS = [
  {
    label: "Creator Lab",
    data: {
      interests: ["music production", "live looping"],
      technologies: ["Web Audio", "MIDI"],
      skills: ["audio engineering"],
    },
  },
  {
    label: "Founder ADHD",
    data: {
      frustrations: ["scattered tools", "idea hoarding"],
      interests: ["automation", "focus"],
      skills: ["typescript", "product"],
    },
  },
  {
    label: "Niche Ops",
    data: {
      industries: ["cybersecurity", "micro-saas"],
      frustrations: ["manual compliance", "alert fatigue"],
      technologies: ["github actions"],
    },
  },
];

export function IdeaInputPanel({
  inputs,
  onChange,
  onGenerate,
  isGenerating,
}: IdeaInputPanelProps) {
  const totalTags = Object.values(inputs).flat().length;

  return (
    <GlassCard className="flex h-full flex-col p-4 sm:p-5" glow="cyan">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Flame className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-white">Input Reactor</h2>
          </div>
          <p className="text-xs text-zinc-500">
            Feed the forge fragments — interests, pain, tech, chaos.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-xs text-zinc-400">
          {totalTags} signals
        </span>
      </div>

      <ScrollArea className="flex-1 pr-3">
        <div className="space-y-4 pb-4">
          {INPUT_FIELDS.map((field, i) => (
            <motion.div
              key={field.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <TagInput
                label={field.label}
                placeholder={field.placeholder}
                tags={inputs[field.key]}
                accent={field.accent}
                onChange={(tags) => onChange({ [field.key]: tags })}
              />
            </motion.div>
          ))}

          <div className="pt-2">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-zinc-600">
              Quick Seeds
            </p>
            <div className="flex flex-wrap gap-2">
              {QUICK_SEEDS.map((seed) => (
                <button
                  key={seed.label}
                  type="button"
                  onClick={() =>
                    onChange({
                      interests: [
                        ...new Set([
                          ...inputs.interests,
                          ...(seed.data.interests ?? []),
                        ]),
                      ],
                      industries: [
                        ...new Set([
                          ...inputs.industries,
                          ...(seed.data.industries ?? []),
                        ]),
                      ],
                      frustrations: [
                        ...new Set([
                          ...inputs.frustrations,
                          ...(seed.data.frustrations ?? []),
                        ]),
                      ],
                      hobbies: inputs.hobbies,
                      technologies: [
                        ...new Set([
                          ...inputs.technologies,
                          ...(seed.data.technologies ?? []),
                        ]),
                      ],
                      skills: [
                        ...new Set([
                          ...inputs.skills,
                          ...(seed.data.skills ?? []),
                        ]),
                      ],
                      randomConcepts: inputs.randomConcepts,
                    })
                  }
                  className="rounded-lg border border-white/8 bg-white/5 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-cyan-500/30 hover:text-cyan-300"
                >
                  {seed.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>

      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="mt-4 w-full gap-2 bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-[0_0_30px_rgba(34,211,238,0.25)] hover:from-cyan-500 hover:to-violet-500"
        size="lg"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Forging concepts…
          </>
        ) : (
          <>
            <Zap className="h-4 w-4" />
            Ignite Reactor
          </>
        )}
      </Button>
    </GlassCard>
  );
}
