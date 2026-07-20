"use client";

import { useSyncExternalStore } from "react";
import {
  loadUsageTelemetry,
  subscribeUsageTelemetry,
  type UsageTelemetry,
} from "@/lib/storage/usage-telemetry";

function getSnapshot(): UsageTelemetry {
  return loadUsageTelemetry();
}

function getServerSnapshot(): UsageTelemetry {
  return loadUsageTelemetry();
}

export function useUsageTelemetry(): UsageTelemetry {
  return useSyncExternalStore(subscribeUsageTelemetry, getSnapshot, getServerSnapshot);
}
