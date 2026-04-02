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
import { CURRENCIES } from "@/lib/constants"
import { round2, toNumber } from "@/lib/bankroll"
import { useAppData } from "@/hooks/use-app-data"

export default function SettingsPage() {
  const { data, setData, hydrated } = useAppData()

  if (!hydrated) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 p-3 pb-8 sm:gap-6 sm:p-6">
      <header className="sticky top-0 z-30 -mx-3 border-b border-border/70 bg-background/85 px-3 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure bankroll baseline, rules, and currency.
            </p>
          </div>
          <Link href="/">
            <Button variant="outline">Back to dashboard</Button>
          </Link>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Bankroll configuration</CardTitle>
          <CardDescription>
            These values drive bankroll calculations and rule-state status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
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
              <label className="mb-1 block text-xs text-muted-foreground">
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
        <CardHeader>
          <CardTitle>Bankroll rules engine</CardTitle>
          <CardDescription>
            Example strategy: baseline $500, trigger +$150, withdraw $100.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">
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
              <label className="mb-1 block text-xs text-muted-foreground">
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
              <label className="mb-1 block text-xs text-muted-foreground">
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
              <label className="mb-1 block text-xs text-muted-foreground">
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
