import type { ComparableSale } from "@/lib/types/comps";
import type { DealInput } from "@/lib/types/deal";
import type { ItemIdentitySources } from "@/lib/types/item-identity";

const DRAFT_STORAGE_KEY = "marketplace-goblin-analyze-draft";

export interface AnalyzeDraft {
  input: DealInput;
  comps: ComparableSale[];
  useCompsForResale: boolean;
  compsEstimateManualOff: boolean;
  identitySources?: ItemIdentitySources;
  updatedAt: string;
}

function isComparableSale(value: unknown): value is ComparableSale {
  if (!value || typeof value !== "object") return false;
  const comp = value as ComparableSale;
  return (
    typeof comp.id === "string" &&
    typeof comp.title === "string" &&
    typeof comp.price === "number" &&
    typeof comp.platform === "string" &&
    typeof comp.listingType === "string"
  );
}

export function loadAnalyzeDraft(): AnalyzeDraft | null {
  if (typeof localStorage === "undefined") return null;

  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const draft = parsed as AnalyzeDraft;
    if (typeof draft.input?.itemName !== "string") return null;
    if (!Array.isArray(draft.comps)) return null;

    return {
      input: draft.input,
      comps: draft.comps.filter(isComparableSale),
      useCompsForResale: draft.useCompsForResale === true,
      compsEstimateManualOff: draft.compsEstimateManualOff === true,
      identitySources: draft.identitySources,
      updatedAt: draft.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveAnalyzeDraft(draft: AnalyzeDraft): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function clearAnalyzeDraft(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}
