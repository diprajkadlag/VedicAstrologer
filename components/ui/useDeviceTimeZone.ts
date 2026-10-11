"use client";

import { useSyncExternalStore } from "react";

import { validTimeZone } from "@/lib/timeZones";

const subscribeToNothing = () => () => undefined;

function readDeviceTimeZone(): string | null {
  try {
    return validTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  } catch {
    return null;
  }
}

/** This browser's IANA time zone; null on the server or when Intl cannot use it. */
export function useDeviceTimeZone(): string | null {
  return useSyncExternalStore(subscribeToNothing, readDeviceTimeZone, () => null);
}
