"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FiltersBarProps {
  search: string;
  tag: string;
  type: string;
  onSearchChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onTypeChange: (value: string) => void;
}

export function FiltersBar({
  search,
  tag,
  type,
  onSearchChange,
  onTagChange,
  onTypeChange,
}: FiltersBarProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Search</span>
        <Input
          value={search}
          onChange={(event) => onSearchChange(event.currentTarget.value)}
          placeholder="Search content, prompt, or tags"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Tag</span>
        <Input
          value={tag}
          onChange={(event) => onTagChange(event.currentTarget.value)}
          placeholder="Filter by single tag"
        />
      </label>
      <label className="space-y-1">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Type</span>
        <Select value={type} onValueChange={(value) => onTypeChange(value ?? "all")}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="lyrics">Lyrics</SelectItem>
            <SelectItem value="cover concepts">Cover Concepts</SelectItem>
            <SelectItem value="titles">Titles</SelectItem>
            <SelectItem value="hooks">Hooks</SelectItem>
          </SelectContent>
        </Select>
      </label>
    </div>
  );
}
