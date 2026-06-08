"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  createDeal,
  deleteDeal,
  loadDeals,
  saveDeals,
  updateDeal,
  updateDealComps,
  type SaveDealOptions,
} from "@/lib/storage/deals";
import type { ComparableSale } from "@/lib/types/comps";
import type { DealInput, SavedDeal } from "@/lib/types/deal";

const listeners = new Set<() => void>();
let cachedDeals: SavedDeal[] | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): SavedDeal[] {
  if (cachedDeals === null) {
    cachedDeals = loadDeals();
  }
  return cachedDeals;
}

function getServerSnapshot(): SavedDeal[] {
  return [];
}

function notify() {
  cachedDeals = null;
  listeners.forEach((listener) => listener());
}

export function useDeals() {
  const deals = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const persist = useCallback((next: SavedDeal[]) => {
    saveDeals(next);
    notify();
  }, []);

  const addDeal = useCallback(
    (input: DealInput, options?: SaveDealOptions) => {
      const deal = createDeal(input, options);
      persist([deal, ...deals]);
      return deal;
    },
    [deals, persist]
  );

  const editDeal = useCallback(
    (id: string, input: DealInput) => {
      persist(updateDeal(deals, id, input));
    },
    [deals, persist]
  );

  const setDealComps = useCallback(
    (id: string, comps: ComparableSale[], useCompsForResale: boolean) => {
      persist(updateDealComps(deals, id, comps, useCompsForResale));
    },
    [deals, persist]
  );

  const removeDeal = useCallback(
    (id: string) => {
      persist(deleteDeal(deals, id));
    },
    [deals, persist]
  );

  return {
    deals,
    isLoaded: true,
    addDeal,
    editDeal,
    setDealComps,
    removeDeal,
  };
}
