"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { calculateSessionProfit } from "@/lib/bankroll";
import { createSeedAppState } from "@/lib/seed-data";
import { parseImportedState } from "@/lib/storage";
import { STORAGE_KEY } from "@/lib/seed-data";
import type {
  AppSettings,
  AppState,
  SessionInput,
  SessionRecord,
  WithdrawalInput,
  WithdrawalRecord,
} from "@/lib/types";

type AppContextValue = {
  state: AppState;
  hydrated: boolean;
  updateSettings: (settings: AppSettings) => void;
  addSession: (input: SessionInput) => void;
  updateSession: (id: string, input: SessionInput) => void;
  deleteSession: (id: string) => void;
  addWithdrawal: (input: WithdrawalInput) => void;
  deleteWithdrawal: (id: string) => void;
  exportData: () => string;
  importData: (json: string) => { success: boolean; message: string };
  resetData: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const timestamp = () => new Date().toISOString();

const buildSessionRecord = (input: SessionInput, existing?: SessionRecord): SessionRecord => {
  const now = timestamp();
  return {
    id: existing?.id ?? createId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...input,
    profitLoss: calculateSessionProfit(input.totalInvested, input.cashout),
  };
};

const buildWithdrawalRecord = (
  input: WithdrawalInput,
  existing?: WithdrawalRecord,
): WithdrawalRecord => {
  const now = timestamp();
  return {
    id: existing?.id ?? createId(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    ...input,
  };
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(createSeedAppState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      setHydrated(true);
      return;
    }

    try {
      setState(parseImportedState(raw));
    } catch {
      setState(createSeedAppState());
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [hydrated, state]);

  const updateSettings = useCallback((settings: AppSettings) => {
    setState((current) => ({
      ...current,
      settings,
      updatedAt: timestamp(),
    }));
  }, []);

  const addSession = useCallback((input: SessionInput) => {
    setState((current) => ({
      ...current,
      sessions: [buildSessionRecord(input), ...current.sessions],
      customTags: Array.from(
        new Set([...current.customTags, ...input.tags.map((tag) => tag.toLowerCase())]),
      ).sort(),
      updatedAt: timestamp(),
    }));
  }, []);

  const updateSession = useCallback((id: string, input: SessionInput) => {
    setState((current) => ({
      ...current,
      sessions: current.sessions.map((session) =>
        session.id === id ? buildSessionRecord(input, session) : session,
      ),
      customTags: Array.from(
        new Set([
          ...current.customTags,
          ...input.tags.map((tag) => tag.toLowerCase()),
          ...current.sessions
            .filter((session) => session.id !== id)
            .flatMap((session) => session.tags.map((tag) => tag.toLowerCase())),
        ]),
      ).sort(),
      updatedAt: timestamp(),
    }));
  }, []);

  const deleteSession = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      sessions: current.sessions.filter((session) => session.id !== id),
      updatedAt: timestamp(),
    }));
  }, []);

  const addWithdrawal = useCallback((input: WithdrawalInput) => {
    setState((current) => ({
      ...current,
      withdrawals: [buildWithdrawalRecord(input), ...current.withdrawals],
      updatedAt: timestamp(),
    }));
  }, []);

  const deleteWithdrawal = useCallback((id: string) => {
    setState((current) => ({
      ...current,
      withdrawals: current.withdrawals.filter((withdrawal) => withdrawal.id !== id),
      updatedAt: timestamp(),
    }));
  }, []);

  const exportData = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importData = useCallback((json: string) => {
    try {
      const parsed = parseImportedState(json);
      setState(parsed);
      return { success: true, message: "Backup imported successfully." };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Import failed.",
      };
    }
  }, []);

  const resetData = useCallback(() => {
    setState(createSeedAppState());
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      hydrated,
      updateSettings,
      addSession,
      updateSession,
      deleteSession,
      addWithdrawal,
      deleteWithdrawal,
      exportData,
      importData,
      resetData,
    }),
    [
      addSession,
      addWithdrawal,
      deleteSession,
      deleteWithdrawal,
      exportData,
      hydrated,
      importData,
      resetData,
      state,
      updateSession,
      updateSettings,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppProvider.");
  }
  return context;
}

export const useAppContext = useAppState;
export const useBankrollApp = useAppState;
