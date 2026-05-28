"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Inbox } from "lucide-react";
import type { Concept } from "@/types/concept";
import { ConceptCard } from "./concept-card";

interface ConceptListProps {
  concepts: Concept[];
  activeConceptId: string | null;
  compareIds: string[];
  onSelect: (id: string) => void;
  onFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onCompare: (id: string) => void;
}

export function ConceptList({
  concepts,
  activeConceptId,
  compareIds,
  onSelect,
  onFavorite,
  onDelete,
  onCompare,
}: ConceptListProps) {
  if (concepts.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center"
      >
        <Inbox className="mb-4 h-12 w-12 text-zinc-700" />
        <h3 className="text-lg font-medium text-zinc-400">Reactor Empty</h3>
        <p className="mt-2 max-w-sm text-sm text-zinc-600">
          Feed the input reactor with interests, frustrations, and sparks — then
          ignite to forge strategic software concepts.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {concepts.map((concept, i) => (
          <motion.div
            key={concept.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: i * 0.05 }}
          >
            <ConceptCard
              concept={concept}
              isActive={concept.id === activeConceptId}
              isComparing={compareIds.includes(concept.id)}
              onSelect={() => onSelect(concept.id)}
              onFavorite={() => onFavorite(concept.id)}
              onDelete={() => onDelete(concept.id)}
              onCompare={() => onCompare(concept.id)}
              compact={concept.id !== activeConceptId}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
