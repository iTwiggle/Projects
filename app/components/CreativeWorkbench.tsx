"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AlbumContextPanel } from "@/app/components/AlbumContextPanel";
import { CoverArtGeneratorPanel } from "@/app/components/CoverArtGeneratorPanel";
import { LyricGeneratorPanel } from "@/app/components/LyricGeneratorPanel";
import { SavedIdeasVault } from "@/app/components/SavedIdeasVault";
import { transformCoverConcept, transformLyricIdea } from "@/app/lib/transforms";
import { loadAlbumContext, loadSavedIdeas, saveAlbumContext, saveSavedIdeas } from "@/app/lib/storage";
import type {
  CoverConcept,
  LyricIdea,
  SavedIdea,
  SavedIdeaType,
  SelectedCardState,
} from "@/app/types";
import {
  DEFAULT_COVER_SETTINGS,
  DEFAULT_GENERATOR_SETTINGS,
} from "@/app/types";

function createSavedId(): string {
  return `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function lyricSavedType(idea: LyricIdea): SavedIdeaType {
  if (idea.type === "title ideas") return "titles";
  if (idea.type === "hooks") return "hooks";
  return "lyrics";
}

function toSavedFromLyric(idea: LyricIdea): SavedIdea {
  return {
    id: createSavedId(),
    type: lyricSavedType(idea),
    content: idea.text,
    sourcePrompt: idea.sourcePrompt,
    tags: idea.tags,
    timestamp: Date.now(),
    favorite: idea.favorite,
    parentIdeaId: idea.parentId,
    lyricIdea: idea,
  };
}

function toSavedFromCover(concept: CoverConcept): SavedIdea {
  return {
    id: createSavedId(),
    type: "cover concepts",
    content: `${concept.title}\n\n${concept.description}\n\nPrompt: ${concept.artPrompt}`,
    sourcePrompt: concept.sourcePrompt,
    tags: [...concept.moodTags, ...concept.symbols].slice(0, 8),
    timestamp: Date.now(),
    favorite: concept.favorite,
    parentIdeaId: concept.parentId,
    coverConcept: concept,
  };
}

export function CreativeWorkbench() {
  const [albumContext, setAlbumContext] = useState(loadAlbumContext);
  const [lyricSettings, setLyricSettings] = useState(DEFAULT_GENERATOR_SETTINGS);
  const [coverSettings, setCoverSettings] = useState(DEFAULT_COVER_SETTINGS);
  const [lyricIdeas, setLyricIdeas] = useState<LyricIdea[]>([]);
  const [coverConcepts, setCoverConcepts] = useState<CoverConcept[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>(loadSavedIdeas);
  const [selectedCard, setSelectedCard] = useState<SelectedCardState | null>(null);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    saveAlbumContext(albumContext);
  }, [albumContext]);

  useEffect(() => {
    saveSavedIdeas(savedIdeas);
  }, [savedIdeas]);

  useEffect(() => {
    if (!statusText) return;
    const timer = window.setTimeout(() => setStatusText(""), 1400);
    return () => window.clearTimeout(timer);
  }, [statusText]);

  const selectedLyric = useMemo(
    () =>
      selectedCard?.cardType === "lyric"
        ? lyricIdeas.find((idea) => idea.id === selectedCard.id) ?? null
        : null,
    [lyricIdeas, selectedCard],
  );
  const selectedCover = useMemo(
    () =>
      selectedCard?.cardType === "cover"
        ? coverConcepts.find((concept) => concept.id === selectedCard.id) ?? null
        : null,
    [coverConcepts, selectedCard],
  );

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatusText("Copied.");
    } catch {
      setStatusText("Copy failed.");
    }
  };

  const saveLyricIdea = (idea: LyricIdea) => {
    setSavedIdeas((prev) => [toSavedFromLyric(idea), ...prev]);
    setStatusText("Lyric saved.");
  };

  const saveCoverConcept = (concept: CoverConcept) => {
    setSavedIdeas((prev) => [toSavedFromCover(concept), ...prev]);
    setStatusText("Cover concept saved.");
  };

  const saveSelectedCard = useCallback(() => {
    if (selectedLyric) {
      saveLyricIdea(selectedLyric);
      return;
    }
    if (selectedCover) {
      saveCoverConcept(selectedCover);
      return;
    }
    setStatusText("No selected card.");
  }, [selectedCover, selectedLyric]);

  const recreateSelected = useCallback(() => {
    if (selectedLyric) {
      const output = transformLyricIdea(
        selectedLyric,
        "recreate",
        lyricSettings,
        albumContext,
        lyricSettings.variationSeed + lyricIdeas.length + 80,
      );
      const nextIdeas = [...(Array.isArray(output) ? output : [output]), ...lyricIdeas];
      setLyricIdeas(nextIdeas);
      setLyricSettings((prev) => ({ ...prev, variationSeed: prev.variationSeed + 3 }));
      setSelectedCard({ id: nextIdeas[0].id, cardType: "lyric" });
      setStatusText("Lyric recreated.");
      return;
    }

    if (selectedCover) {
      const next = transformCoverConcept(
        selectedCover,
        "recreate",
        coverSettings,
        albumContext,
        coverSettings.variationSeed + coverConcepts.length + 80,
      );
      setCoverConcepts((prev) => [next, ...prev]);
      setCoverSettings((prev) => ({ ...prev, variationSeed: prev.variationSeed + 3 }));
      setSelectedCard({ id: next.id, cardType: "cover" });
      setStatusText("Cover recreated.");
    }
  }, [
    albumContext,
    coverConcepts.length,
    coverSettings,
    lyricIdeas,
    lyricSettings,
    selectedCover,
    selectedLyric,
  ]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName ?? "";
      const isTextarea = tag === "TEXTAREA";
      const isEditable =
        isTextarea || tag === "INPUT" || tag === "SELECT" || Boolean(target?.isContentEditable);

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        const input = document.getElementById("main-topic-input") as HTMLInputElement | null;
        input?.focus();
        input?.select();
        return;
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveSelectedCard();
        return;
      }

      if (!event.metaKey && !event.ctrlKey && !event.altKey && event.key.toLowerCase() === "r" && !isEditable) {
        event.preventDefault();
        recreateSelected();
        return;
      }

      if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.metaKey &&
        !event.ctrlKey &&
        !isTextarea
      ) {
        const generateButton = document.getElementById("generate-lyrics-button");
        if (generateButton) {
          event.preventDefault();
          generateButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    recreateSelected,
    saveSelectedCard,
  ]);

  return (
    <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Rap Lab: Local Creative Workstation</h1>
        <p className="max-w-4xl text-sm text-muted-foreground">
          Structured ideation for lyrics, reframes, alternate directions, album identity, and cover art concepts.
        </p>
      </header>

      <AlbumContextPanel context={albumContext} onChange={setAlbumContext} />

      <LyricGeneratorPanel
        settings={lyricSettings}
        onSettingsChange={setLyricSettings}
        ideas={lyricIdeas}
        onIdeasChange={setLyricIdeas}
        albumContext={albumContext}
        selectedCard={selectedCard}
        onSelectCard={setSelectedCard}
        onSaveIdea={saveLyricIdea}
        onCopyText={copyText}
      />

      <CoverArtGeneratorPanel
        settings={coverSettings}
        onSettingsChange={setCoverSettings}
        concepts={coverConcepts}
        onConceptsChange={setCoverConcepts}
        albumContext={albumContext}
        selectedCard={selectedCard}
        onSelectCard={setSelectedCard}
        onSaveConcept={saveCoverConcept}
        onCopyText={copyText}
      />

      <SavedIdeasVault ideas={savedIdeas} onIdeasChange={setSavedIdeas} onCopyText={copyText} />

      {statusText ? (
        <div className="pointer-events-none fixed right-4 bottom-4 rounded-md border border-border bg-card px-3 py-2 text-xs text-card-foreground shadow-lg">
          {statusText}
        </div>
      ) : null}
    </main>
  );
}
