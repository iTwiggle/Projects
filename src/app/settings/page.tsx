"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CURRENCIES, RULE_PRESETS } from "@/lib/constants"
import { round2, toNumber } from "@/lib/bankroll"
import { useAppData } from "@/hooks/use-app-data"

export default function SettingsPage() {
  const { data, setData, hydrated } = useAppData()

  function isPresetActive(presetId: string) {
    const preset = RULE_PRESETS.find((entry) => entry.id === presetId)
    if (!preset) return false
    const rules = data.settings.rules
    return (
      data.settings.startingBankroll === preset.startingBankroll &&
      rules.stopLossAmount === preset.rules.stopLossAmount &&
      rules.withdrawalTriggerAmount === preset.rules.withdrawalTriggerAmount &&
      rules.withdrawalAmount === preset.rules.withdrawalAmount &&
      rules.minBankrollFloor === preset.rules.minBankrollFloor
    )
  }

  function applyPreset(presetId: string) {
    const preset = RULE_PRESETS.find((entry) => entry.id === presetId)
    if (!preset) return

    setData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        startingBankroll: preset.startingBankroll,
        rules: {
          ...preset.rules,
        },
      },
    }))
  }

  if (!hydrated) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 p-3 pb-8 sm:gap-6 sm:p-5 sm:pb-10">
      <header className="sticky top-0 z-30 -mx-3 border-b border-border/60 bg-background/90 px-3 py-3 backdrop-blur-md sm:-mx-5 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight">Settings</h1>
            <p className="text-[13px] text-muted-foreground">
              Configure bankroll baseline, rules, and currency
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to dashboard
            </Button>
          </Link>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Rule presets</CardTitle>
          <CardDescription className="text-[13px]">
            Quick starting points for common game formats. You can still edit values after applying.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {RULE_PRESETS.map((preset) => (
            <div
              key={preset.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 px-4 py-3"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{preset.label}</p>
                  {isPresetActive(preset.id) ? (
                    <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-300">
                      active
                    </span>
                  ) : null}
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{preset.description}</p>
                <p className="text-xs text-muted-foreground/80">
                  Start {preset.startingBankroll} · stop-loss {preset.rules.stopLossAmount} · trigger{" "}
                  {preset.rules.withdrawalTriggerAmount} · withdraw {preset.rules.withdrawalAmount}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => applyPreset(preset.id)}>
                Apply
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Bankroll configuration</CardTitle>
          <CardDescription className="text-[13px]">
            These values drive bankroll calculations and rule-state status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Starting bankroll
              </label>
              <Input
                inputMode="decimal"
                value={String(data.settings.startingBankroll)}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      startingBankroll: round2(
                        Math.max(0, toNumber(event.target.value, 0))
                      ),
                    },
                  }))
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Preferred currency
              </label>
              <Select
                value={data.settings.currency}
                onValueChange={(value) =>
                  setData((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      currency: value,
                    },
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Bankroll rules engine</CardTitle>
          <CardDescription className="text-[13px]">
            Example strategy: baseline $500, trigger +$150, withdraw $100.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Stop-loss amount
              </label>
              <Input
                inputMode="decimal"
                value={String(data.settings.rules.stopLossAmount)}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      rules: {
                        ...prev.settings.rules,
                        stopLossAmount: round2(
                          Math.max(0, toNumber(event.target.value, 0))
                        ),
                      },
                    },
                  }))
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Withdrawal trigger amount
              </label>
              <Input
                inputMode="decimal"
                value={String(data.settings.rules.withdrawalTriggerAmount)}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      rules: {
                        ...prev.settings.rules,
                        withdrawalTriggerAmount: round2(
                          Math.max(0, toNumber(event.target.value, 0))
                        ),
                      },
                    },
                  }))
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Withdrawal amount
              </label>
              <Input
                inputMode="decimal"
                value={String(data.settings.rules.withdrawalAmount)}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      rules: {
                        ...prev.settings.rules,
                        withdrawalAmount: round2(
                          Math.max(0, toNumber(event.target.value, 0))
                        ),
                      },
                    },
                  }))
                }
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Minimum bankroll floor
              </label>
              <Input
                inputMode="decimal"
                value={String(data.settings.rules.minBankrollFloor)}
                onChange={(event) =>
                  setData((prev) => ({
                    ...prev,
                    settings: {
                      ...prev.settings,
                      rules: {
                        ...prev.settings.rules,
                        minBankrollFloor: round2(
                          Math.max(0, toNumber(event.target.value, 0))
                        ),
                      },
                    },
                  }))
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
