"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isAuthConfigured } from "@/lib/auth/config";
import type { SessionStatus } from "@/types/database";
import {
  isTerminalWaitingStatus,
  waitStepIndexFromStatus,
} from "@/lib/tes/waiting-steps";

export type WaitingSessionState = {
  status: SessionStatus;
  waitStepIndex: number;
  connected: boolean;
  loading: boolean;
  error: string | null;
};

const POLL_MS = 10_000;

export function useWaitingSession(sessionId: string) {
  const [state, setState] = useState<WaitingSessionState>({
    status: "awaiting_review",
    waitStepIndex: 1,
    connected: false,
    loading: true,
    error: null,
  });

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applyStatus = useCallback((status: SessionStatus) => {
    setState((prev) => ({
      ...prev,
      status,
      waitStepIndex: waitStepIndexFromStatus(status),
      loading: false,
      error: null,
    }));
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to load session status");
      }
      const { session } = (await res.json()) as { session: { status: SessionStatus } };
      applyStatus(session.status);
      return session.status;
    } catch (e) {
      setState((prev) => ({
        ...prev,
        loading: false,
        connected: false,
        error: e instanceof Error ? e.message : "Failed to load status",
      }));
      return null;
    }
  }, [sessionId, applyStatus]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    const status = await fetchStatus();
    if (status) {
      setState((prev) => ({ ...prev, connected: true }));
    }
    return status;
  }, [fetchStatus]);

  useEffect(() => {
    let cancelled = false;
    let channel: any = null;

    async function init() {
      if (!isAuthConfigured()) {
        setState((prev) => ({
          ...prev,
          loading: false,
          connected: false,
          error: "Authentication is not configured — session status unavailable.",
        }));
        return;
      }

      const status = await fetchStatus();
      if (cancelled) return;

      if (status) {
        setState((prev) => ({ ...prev, connected: true }));
      }

      try {
        const supabase = createClient();
        channel = supabase
          .channel(`session:${sessionId}`)
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "test_sessions",
              filter: `id=eq.${sessionId}`,
            },
            (payload) => {
              const next = payload.new as { status?: SessionStatus };
              if (next.status) {
                applyStatus(next.status);
                setState((prev) => ({ ...prev, connected: true }));
              }
            },
          )
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "session_results",
              filter: `session_id=eq.${sessionId}`,
            },
            (payload) => {
              const row = (payload.new ?? payload.old) as {
                published_at?: string | null;
              };
              if (row?.published_at) {
                applyStatus("completed");
                setState((prev) => ({ ...prev, connected: true }));
              }
            },
          )
          .subscribe((status) => {
            if (cancelled) return;
            const ok = status === "SUBSCRIBED";
            setState((prev) => ({
              ...prev,
              connected: ok || prev.connected,
            }));
          });
      } catch {
        setState((prev) => ({ ...prev, connected: false }));
      }

      pollRef.current = setInterval(() => {
        void fetchStatus();
      }, POLL_MS);
    }

    void init();

    return () => {
      cancelled = true;
      if (pollRef.current) clearInterval(pollRef.current);
      if (channel) {
        const supabase = createClient();
        void supabase.removeChannel(channel);
      }
    };
  }, [sessionId, fetchStatus, applyStatus]);

  return {
    ...state,
    refresh,
    isComplete: isTerminalWaitingStatus(state.status),
  };
}
