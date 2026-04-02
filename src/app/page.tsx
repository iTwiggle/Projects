"use client"

import { BankrollSidekickApp } from "@/components/bankroll-sidekick-app"
import { useAppData } from "@/hooks/use-app-data"

export default function HomePage() {
  const { data, setData, hydrated } = useAppData()

  if (!hydrated) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Loading your local bankroll data...</p>
      </div>
    )
  }

  return <BankrollSidekickApp data={data} onChange={setData} />
}
