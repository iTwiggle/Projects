"use client"

import { useEffect, useState } from "react"

import { createDefaultAppData } from "@/lib/constants"
import { loadAppData, saveAppData } from "@/lib/storage"
import type { AppData } from "@/lib/types"

export function useAppData() {
  const [data, setData] = useState<AppData>(() => createDefaultAppData())
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setData(loadAppData())
      setHydrated(true)
    })

    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    saveAppData(data)
  }, [data, hydrated])

  return { data, setData, hydrated }
}
