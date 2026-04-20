"use client";

import { useMemo, useState } from "react";

import type { SavedIdea } from "@/app/types";
import { FiltersBar } from "@/app/components/FiltersBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SavedIdeasVaultProps {
  ideas: SavedIdea[];
  onIdeasChange: (next: SavedIdea[]) => void;
  onCopyText: (value: string) => void;
}

type VaultTab = "lyrics" | "cover concepts" | "titles" | "hooks" | "favorites";

function tabFilter(ideas: SavedIdea[], tab: VaultTab): SavedIdea[] {
  if (tab === "favorites") {
    return ideas.filter((idea) => idea.favorite);
  }
  return ideas.filter((idea) => idea.type === tab);
}

export function SavedIdeasVault({ ideas, onIdeasChange, onCopyText }: SavedIdeasVaultProps) {
  const [activeTab, setActiveTab] = useState<VaultTab>("lyrics");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("");
  const [type, setType] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");

  const filtered = useMemo(() => {
    return tabFilter(ideas, activeTab).filter((idea) => {
      if (type !== "all" && idea.type !== type) {
        return false;
      }
      const haystack = `${idea.content} ${idea.sourcePrompt} ${idea.tags.join(" ")}`.toLowerCase();
      const searchMatch = search.trim() ? haystack.includes(search.trim().toLowerCase()) : true;
      const tagMatch = tag.trim() ? idea.tags.map((value) => value.toLowerCase()).includes(tag.trim().toLowerCase()) : true;
      return searchMatch && tagMatch;
    });
  }, [activeTab, ideas, search, tag, type]);

  const startEdit = (idea: SavedIdea) => {
    setEditingId(idea.id);
    setDraftContent(idea.content);
  };

  const saveEdit = (ideaId: string) => {
    onIdeasChange(
      ideas.map((idea) => (idea.id === ideaId ? { ...idea, content: draftContent.trim() || idea.content } : idea)),
    );
    setEditingId(null);
    setDraftContent("");
  };

  const duplicateIdea = (idea: SavedIdea) => {
    const duplicate: SavedIdea = {
      ...idea,
      id: `saved-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      favorite: false,
    };
    onIdeasChange([duplicate, ...ideas]);
  };

  const removeIdea = (ideaId: string) => {
    onIdeasChange(ideas.filter((idea) => idea.id !== ideaId));
  };

  const toggleFavorite = (ideaId: string) => {
    onIdeasChange(ideas.map((idea) => (idea.id === ideaId ? { ...idea, favorite: !idea.favorite } : idea)));
  };

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur">
      <CardHeader>
        <CardTitle>Saved Ideas Vault</CardTitle>
        <CardDescription>Persistent local vault with inline editing, filtering, duplication, and favorites.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FiltersBar
          search={search}
          tag={tag}
          type={type}
          onSearchChange={setSearch}
          onTagChange={setTag}
          onTypeChange={setType}
        />

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as VaultTab)}>
          <TabsList>
            <TabsTrigger value="lyrics">Lyrics</TabsTrigger>
            <TabsTrigger value="cover concepts">Cover Concepts</TabsTrigger>
            <TabsTrigger value="titles">Titles</TabsTrigger>
            <TabsTrigger value="hooks">Hooks</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/70 p-6 text-sm text-muted-foreground">
                No saved items match this filter yet.
              </div>
            ) : (
              filtered.map((idea) => (
                <Card key={idea.id} size="sm" className="border-border/70">
                  <CardHeader>
                    <CardTitle className="text-sm capitalize">{idea.type}</CardTitle>
                    <CardDescription>
                      {new Date(idea.timestamp).toLocaleString()} {idea.parentIdeaId ? `• remixed from ${idea.parentIdeaId}` : ""}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {editingId === idea.id ? (
                      <Input value={draftContent} onChange={(event) => setDraftContent(event.currentTarget.value)} />
                    ) : (
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{idea.content}</p>
                    )}
                    <p className="text-xs text-muted-foreground">Source: {idea.sourcePrompt}</p>
                    <div className="flex flex-wrap gap-2">
                      {idea.tags.map((entry) => (
                        <Badge key={`${idea.id}-${entry}`} variant="outline">
                          {entry}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => onCopyText(idea.content)}>
                      Copy
                    </Button>
                    {editingId === idea.id ? (
                      <Button size="sm" variant="outline" onClick={() => saveEdit(idea.id)}>
                        Save Edit
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => startEdit(idea)}>
                        Edit
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => duplicateIdea(idea)}>
                      Duplicate
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => toggleFavorite(idea.id)}>
                      {idea.favorite ? "Unfavorite" : "Favorite"}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => removeIdea(idea.id)}>
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
