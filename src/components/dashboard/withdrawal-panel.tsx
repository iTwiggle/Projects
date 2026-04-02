"use client";

import { Trash2, Wallet } from "lucide-react";
import { useMemo, useState } from "react";

import { useAppState } from "@/components/shared/app-provider";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
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
import { formatCurrency, formatDateLabel, roundCurrency } from "@/lib/bankroll";

export function WithdrawalPanel() {
  const { state, addWithdrawal, deleteWithdrawal } = useAppState();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...state.withdrawals].sort((a, b) => b.date.localeCompare(a.date)),
    [state.withdrawals],
  );

  const securedTotal = roundCurrency(
    state.withdrawals.reduce((sum, item) => sum + item.amount, 0),
  );

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = Number(amount);

    if (!date) {
      setError("Withdrawal date is required.");
      return;
    }

    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Enter a withdrawal amount greater than zero.");
      return;
    }

    addWithdrawal({
      date,
      amount: roundCurrency(parsed),
      note: note.trim(),
    });

    setAmount("");
    setNote("");
    setError(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle>Log withdrawal</CardTitle>
          <CardDescription>
            Track money secured outside your active bankroll.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-date">Date</Label>
              <Input
                id="withdrawal-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-amount">Amount</Label>
              <Input
                id="withdrawal-amount"
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="100"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdrawal-note">Note</Label>
              <Input
                id="withdrawal-note"
                placeholder="Moved profit to savings"
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            <Button className="w-full" type="submit">
              Save withdrawal
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Withdrawal history</CardTitle>
            <CardDescription>
              Total secured outside bankroll:{" "}
              {formatCurrency(securedTotal, state.settings.currency)}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {sorted.length === 0 ? (
            <EmptyState
              icon={<Wallet className="h-5 w-5" />}
              title="No withdrawals yet"
              description="When you move money out of the bankroll, log it here so your active roll stays accurate."
            />
          ) : (
            sorted.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-white">
                    {formatDateLabel(withdrawal.date)}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {withdrawal.note || "No note"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-white">
                      {formatCurrency(withdrawal.amount, state.settings.currency)}
                    </p>
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">
                      Secured
                    </p>
                  </div>
                  <ConfirmDialog
                    title="Delete withdrawal?"
                    description="This will remove the withdrawal from the secured total and active bankroll calculation."
                    confirmLabel="Delete"
                    destructive
                    trigger={
                      <Button size="icon" type="button" variant="ghost">
                        <Trash2 className="size-4" />
                      </Button>
                    }
                    onConfirm={() => deleteWithdrawal(withdrawal.id)}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
