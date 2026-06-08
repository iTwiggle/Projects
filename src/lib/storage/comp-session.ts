import { COMP_PLATFORMS } from "@/lib/types/comps";

const SESSION_PLATFORM_KEY = "marketplace-goblin-last-comp-platform";

export function getLastCompPlatform(): string {
  if (typeof sessionStorage === "undefined") return COMP_PLATFORMS[0];

  const stored = sessionStorage.getItem(SESSION_PLATFORM_KEY);
  if (stored && COMP_PLATFORMS.includes(stored as (typeof COMP_PLATFORMS)[number])) {
    return stored;
  }

  return COMP_PLATFORMS[0];
}

export function setLastCompPlatform(platform: string): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(SESSION_PLATFORM_KEY, platform);
}
