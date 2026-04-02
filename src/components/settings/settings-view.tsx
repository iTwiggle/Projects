"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, RotateCcw, Save, Upload } from "lucide-react";

import { useAppState } from "@/components/shared/app-provider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { computeBankrollSummary, formatCurrency } from "@/lib/bankroll";
import { CURRENCIES, type AppSettings, type CurrencyCode } from "@/lib/types";

type FormState = {
  startingBankroll: string;
  stopLossAmount: string;
  withdrawalTriggerAmount: string;
  withdrawalAmount: string;
  minimumBankrollFloor: string;
  currency: CurrencyCode;
};

function toFormState(settings: AppSettings): FormState {
  return {
    startingBankroll: String(settings.startingBankroll),
    stopLossAmount: String(settings.rules.stopLossAmount),
    withdrawalTriggerAmount: String(settings.rules.withdrawalTriggerAmount),
    withdrawalAmount: String(settings.rules.withdrawalAmount),
    minimumBankrollFloor: String(settings.rules.minimumBankrollFloor),
    currency: settings.currency,
  };
}

export function SettingsView() {
  const { state, updateSettings, exportData, importData, resetData } = useAppState();
  const [form, setForm] = useState<FormState>(() => toFormState(state.settings));
  const [lastSettingsKey, setLastSettingsKey] = useState(() =>
    JSON.stringify(state.settings),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const summary = useMemo(
    () =>
      computeBankrollSummary(
        state.settings,
        state.sessions,
        state.withdrawals,
        state.deposits,
      ),
    [state.deposits, state.sessions, state.settings, state.withdrawals],
  );

  const settingsKey = JSON.stringify(state.settings);
  if (settingsKey !== lastSettingsKey) {
    setLastSettingsKey(settingsKey);
    setForm(toFormState(state.settings));
  }

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value as never }));
    setNotice(null);
    setImportError(null);
  };

  const handleSave = () => {
    const startingBankroll = Number(form.startingBankroll);
    const stopLossAmount = Number(form.stopLossAmount);
    const withdrawalTriggerAmount = Number(form.withdrawalTriggerAmount);
    const withdrawalAmount = Number(form.withdrawalAmount);
    const minimumBankrollFloor = Number(form.minimumBankrollFloor);

    if (
      [
        startingBankroll,
        stopLossAmount,
        withdrawalTriggerAmount,
        withdrawalAmount,
        minimumBankrollFloor,
      ].some((value) => !Number.isFinite(value) || value < 0)
    ) {
      setNotice("All settings must be valid non-negative numbers.");
      return;
    }

    updateSettings({
      startingBankroll,
      currency: form.currency,
      rules: {
        stopLossAmount,
        withdrawalTriggerAmount,
        withdrawalAmount,
        minimumBankrollFloor,
      },
    });

    setNotice("Settings saved locally.");
    setLastSettingsKey(JSON.stringify({
      startingBankroll,
      currency: form.currency,
      rules: {
        stopLossAmount,
        withdrawalTriggerAmount,
        withdrawalAmount,
        minimumBankrollFloor,
      },
    }));
  };

  const handleExport = () => {
    const payload = exportData();
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `bankroll-sidekick-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const result = importData(text);

    if (result.success) {
      setNotice(result.message);
      setImportError(null);
      setLastSettingsKey(JSON.stringify(state.settings));
    } else {
      setImportError(result.message);
    }

    event.target.value = "";
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-3">
        <Button asChild variant="secondary">
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </Button>
      </div>

      <SectionHeading
        eyebrow="Settings"
        title="Bankroll configuration"
        description="Adjust starting bankroll, rule thresholds, currency, and local backups."
      />

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Core settings</CardTitle>
            <CardDescription>Everything here stays local to this browser.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startingBankroll">Starting bankroll</Label>
              <Input
                id="startingBankroll"
                inputMode="decimal"
                value={form.startingBankroll}
                onChange={(event) =>
                  handleChange("startingBankroll", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Preferred currency</Label>
              <Select
                id="currency"
                value={form.currency}
                onChange={(event) =>
                  handleChange("currency", event.target.value)
                }
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stopLossAmount">Stop-loss amount</Label>
              <Input
                id="stopLossAmount"
                inputMode="decimal"
                value={form.stopLossAmount}
                onChange={(event) => handleChange("stopLossAmount", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minimumBankrollFloor">Minimum bankroll floor</Label>
              <Input
                id="minimumBankrollFloor"
                inputMode="decimal"
                value={form.minimumBankrollFloor}
                onChange={(event) =>
                  handleChange("minimumBankrollFloor", event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdrawalTriggerAmount">Withdrawal trigger amount</Label>
              <Input
                id="withdrawalTriggerAmount"
                inputMode="decimal"
                value={form.withdrawalTriggerAmount}
                onChange={(event) =>
                  handleChange("withdrawalTriggerAmount", event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawalAmount">Withdrawal amount</Label>
              <Input
                id="withdrawalAmount"
                inputMode="decimal"
                value={form.withdrawalAmount}
                onChange={(event) =>
                  handleChange("withdrawalAmount", event.target.value)
                }
              />
            </div>

            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <Button onClick={handleSave}>
                <Save className="size-4" />
                Save settings
              </Button>
              {notice ? <p className="text-sm text-zinc-300">{notice}</p> : null}
              {importError ? (
                <p className="text-sm text-rose-300">{importError}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Rule preview</CardTitle>
            <CardDescription>
              Current bankroll interpretation using your saved rules.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-zinc-300">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                Current bankroll
              </p>
              <p className="mt-2 text-3xl font-semibold text-zinc-100">
                {formatCurrency(summary.currentBankroll, state.settings.currency)}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Effective baseline
                </p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {formatCurrency(summary.effectiveBaseline, state.settings.currency)}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-zinc-950/80 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                  Status
                </p>
                <p className="mt-2 text-lg font-semibold capitalize text-zinc-100">
                  {summary.status}
                </p>
              </div>
            </div>
            <p className="leading-6 text-zinc-400">
              Withdrawal logic is simple: once bankroll reaches the current baseline
              plus the configured trigger amount, the app suggests the configured
              withdrawal. Logged withdrawals stay out of bankroll and become part of
              your effective baseline history.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Backups and reset</CardTitle>
          <CardDescription>
            Export all data as JSON, import a backup, or restore the seeded example.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-center">
          <Button variant="secondary" onClick={handleExport}>
            <Download className="size-4" />
            Export JSON backup
          </Button>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10">
            <Upload className="size-4" />
            Import JSON backup
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleImport}
            />
          </label>

          <ConfirmDialog
            title="Reset all local data?"
            description="This restores the example seed data and removes your current local state from this browser."
            confirmLabel="Reset data"
            destructive
            onConfirm={resetData}
            trigger={
              <Button variant="ghost">
                <RotateCcw className="size-4" />
                Reset local data
              </Button>
            }
          />
        </CardContent>
      </Card>
    </main>
  );
}
