"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/browser";

// Public DSN (safe to expose in the client bundle by design).
const SENTRY_DSN =
  "https://8fc81c7ba7714593e1e81590960f5274@o4512124723593216.ingest.us.sentry.io/4512124752166916";

let initialized = false;

/**
 * Initialises Sentry error monitoring on the client. Wrapped in try/catch so
 * monitoring setup can never break the app itself.
 */
export function SentryInit() {
  useEffect(() => {
    if (initialized) return;
    initialized = true;
    try {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV,
        // Error monitoring only for now (no tracing/replay overhead).
        tracesSampleRate: 0,
      });
    } catch {
      // Never let monitoring setup break the application.
    }
  }, []);

  return null;
}
